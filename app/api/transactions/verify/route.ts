import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';

export async function POST(req: Request) {
  try {
    const { tx_ref } = await req.json();
    
    // 1. Get Transaction
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    // 2. If already delivered, stop
    if (transaction.status === 'delivered') return NextResponse.json({ status: 'delivered' });
    
    let currentStatus = transaction.status;

    // 3. Verify Payment with Flutterwave (if pending)
    if (currentStatus === 'pending') {
        try {
            const flwVerify = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
                headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
            });

            const flwData = flwVerify.data.data;

            // Check specifically for successful charge
            if (flwVerify.data.status === 'success' && flwData.status === 'successful' && flwData.amount >= transaction.amount) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { 
                        status: 'paid',
                        paymentData: JSON.stringify(flwData)
                    }
                });
                currentStatus = 'paid';
            }
        } catch (error) {
            console.error('FLW Verify Error:', error);
            // Don't fail the request, just stay pending
        }
    }

    // 4. TRIGGER DELIVERY (The Critical Fix)
    // If Paid AND it's Data AND not yet delivered -> Call Amigo
    if (currentStatus === 'paid' && transaction.type === 'data') {
        
        console.log(`[Auto-Delivery] Attempting delivery for ${tx_ref}`);
        
        const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
        
        if (plan) {
            const networkId = AMIGO_NETWORKS[plan.network];
            
            // Exact payload format that works in console
            const amigoPayload = {
                network: networkId,
                mobile_number: transaction.phone,
                plan: Number(plan.planId),
                Ported_number: true
            };

            // Call Tunnel
            const amigoRes = await callAmigoAPI('data/', amigoPayload, tx_ref); // Using 'data/' as endpoint

            const isSuccess = amigoRes.success && (amigoRes.data.success === true || amigoRes.data.status === 'delivered' || amigoRes.data.Status === 'successful');

            if (isSuccess) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'delivered',
                        deliveryData: JSON.stringify(amigoRes.data)
                    }
                });
                currentStatus = 'delivered';
                console.log(`[Auto-Delivery] SUCCESS for ${tx_ref}`);
            } else {
                console.error(`[Auto-Delivery] FAILED for ${tx_ref}`, amigoRes.data);
            }
        }
    }

    return NextResponse.json({ status: currentStatus });

  } catch (error) {
    console.error('Verification System Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}