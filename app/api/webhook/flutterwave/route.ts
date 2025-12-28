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
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers.get('verif-hash');

  if (!signature || signature !== secret) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = await req.json();
  const { txRef, status } = body.data || body; // Adjust based on exact FW webhook payload structure

  if (status !== 'successful') {
     return NextResponse.json({ received: true });
  }

  // Idempotency Check & Logic similar to Verify Endpoint
  // In a real production app, extract this logic to a shared service
  
  try {
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref: txRef } });
    if (!transaction) return NextResponse.json({ error: 'Tx not found' }, { status: 404 });

    if (transaction.status === 'pending') {
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'paid' }
        });
        
        // DATA DELIVERY LOGIC
        if (transaction.type === 'data') {
             const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
             if (plan) {
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
                                'X-API-Key': process.env.AMIGO_API_KEY,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    if (amigoRes.data.success || amigoRes.data.status === 'delivered') {
                        await prisma.transaction.update({
                            where: { id: transaction.id },
                            data: { status: 'delivered', deliveryData: amigoRes.data }
                        });
                    }
                 } catch (e) {
                     console.error("Webhook Amigo Fail", e);
                 }
             }
        }
    }
  } catch (error) {
      console.error('Webhook Error', error);
  }

  return NextResponse.json({ received: true });
}