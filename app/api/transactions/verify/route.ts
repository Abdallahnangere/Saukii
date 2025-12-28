import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';

const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};

export async function POST(req: Request) {
  try {
    const { tx_ref } = await req.json();
    
    // 1. Get Transaction
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    // 2. Return if already final
    if (transaction.status === 'delivered') return NextResponse.json({ status: 'delivered' });
    if (transaction.status === 'paid' && transaction.type === 'ecommerce') return NextResponse.json({ status: 'paid' });

    // 3. Verify with Flutterwave
    // Note: In bank transfer flow, we usually verify the FLW transaction ID, but here we use tx_ref lookup
    // Assuming we can lookup by tx_ref or re-query the charge endpoint if we stored the flw_ref
    // For V3, standard verification endpoint:
    const flwVerify = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
    });

    const flwData = flwVerify.data.data;

    if (flwVerify.data.status === 'success' && flwData.status === 'successful' && flwData.amount >= transaction.amount) {
        
        // UPDATE TO PAID
        if (transaction.status === 'pending') {
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'paid' }
            });
            transaction.status = 'paid';
        }

        // 4. TRIGGER AMIGO IF DATA
        if (transaction.type === 'data' && transaction.status === 'paid' && !transaction.deliveryData) {
            
            // Fetch Plan details
            const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
            if (!plan) throw new Error('Plan not found for delivery');

            const networkId = AMIGO_NETWORKS[plan.network];

            try {
                const amigoRes = await axios.post(
                    `${process.env.AMIGO_BASE_URL}/api/data/`,
                    {
                        network: networkId,
                        mobile_number: transaction.phone,
                        plan: plan.planId,
                        Ported_number: true
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.AMIGO_API_KEY}`, // Using Bearer as mostly standard, or X-API-Key if forced
                            'X-API-Key': process.env.AMIGO_API_KEY, // Providing both for safety based on doc nuances
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (amigoRes.data.success || amigoRes.data.status === 'delivered') {
                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            status: 'delivered',
                            deliveryData: amigoRes.data
                        }
                    });
                    transaction.status = 'delivered';
                } else {
                    console.error('Amigo Failed:', amigoRes.data);
                }
            } catch (amigoError) {
                console.error('Amigo API Error:', amigoError);
                // Keep status as PAID so admin can retry
            }
        }
    }

    return NextResponse.json({ status: transaction.status });

  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}