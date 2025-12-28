import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';

// Amigo Network Mapping
const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};

export async function POST(req: Request) {
  try {
    const { tx_ref } = await req.json();
    
    // 1. Get Transaction from DB
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    // 2. If already delivered/paid, return immediately to save API calls
    if (transaction.status === 'delivered') return NextResponse.json({ status: 'delivered' });
    
    // 3. STRICT: Verify with Flutterwave
    const flwVerify = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
    });

    const flwData = flwVerify.data.data;

    // ONLY proceed if Flutterwave says "successful" AND amount matches
    if (flwVerify.data.status === 'success' && flwData.status === 'successful' && flwData.amount >= transaction.amount) {
        
        // Update DB to PAID if it was pending
        if (transaction.status === 'pending') {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'paid' }
            });
            transaction.status = 'paid';
        }

        // 4. Trigger Amigo (Instant Data Delivery)
        if (transaction.type === 'data' && transaction.status === 'paid' && !transaction.deliveryData) {
            
            // Fetch the Plan details to get the Amigo Plan ID (e.g., 1001)
            const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
            
            if (plan) {
                const networkId = AMIGO_NETWORKS[plan.network];

                try {
                    // Call Amigo API exactly as documented
                    const amigoPayload = {
                        network: networkId,
                        mobile_number: transaction.phone,
                        plan: plan.planId, // This must be the integer ID (e.g. 1001)
                        Ported_number: true
                    };

                    const amigoRes = await axios.post(
                        'https://amigo.ng/api/data/',
                        amigoPayload,
                        {
                            headers: {
                                'X-API-Key': process.env.AMIGO_API_KEY, // Use X-API-Key header
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    // Check Amigo response
                    // Amigo returns { success: true, status: 'delivered', ... }
                    if (amigoRes.data.success === true || amigoRes.data.status === 'delivered') {
                        await prisma.transaction.update({
                            where: { id: transaction.id },
                            data: {
                                status: 'delivered',
                                deliveryData: amigoRes.data
                            }
                        });
                        transaction.status = 'delivered';
                    } else {
                        console.error('Amigo Delivery Failed:', amigoRes.data);
                        // We keep status as 'paid' so admin can see money is in but data failed
                    }
                } catch (amigoError: any) {
                    console.error('Amigo API Network Error:', amigoError?.response?.data || amigoError.message);
                }
            }
        }
    }

    // Return the status (It will be 'pending' if FLW failed, 'paid' if money in but Amigo failed, 'delivered' if all good)
    return NextResponse.json({ status: transaction.status });

  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}