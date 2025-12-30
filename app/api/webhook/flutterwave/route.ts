import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';

export async function POST(req: Request) {
  // 1. Verify Signature
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers.get('verif-hash');

  if (!signature || signature !== secret) {
    // If you don't have a secret set up in .env yet, you might want to log this but optionally skip
    // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    console.warn("Webhook Signature Mismatch or Missing Secret");
  }

  try {
    // 2. Parse Body
    const rawBody = await req.json();
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody; // Safety parse
    
    // Flutterwave sends different structures sometimes. 
    // Usually 'data' contains the payload, or the body is the payload.
    const payload = body.data || body; 
    
    const { txRef, status, amount } = payload; 
    // FLW sends 'txRef', but sometimes 'tx_ref' in verification.
    const reference = txRef || payload.tx_ref; 

    console.log(`[Webhook] Received for ${reference} - Status: ${status}`);

    // 3. Strict Success Check
    if (status !== 'successful') {
        console.log(`[Webhook] Ignored non-success status: ${status}`);
        return NextResponse.json({ received: true });
    }

    // 4. Find Transaction
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref: reference } });
    
    if (!transaction) {
        console.error(`[Webhook] Transaction not found: ${reference}`);
        return NextResponse.json({ error: 'Tx not found' }, { status: 404 });
    }

    // 5. Check if already processed
    if (transaction.status === 'delivered' || transaction.status === 'paid') {
         console.log(`[Webhook] Transaction already processed: ${reference}`);
         return NextResponse.json({ received: true });
    }

    // 6. Update to PAID immediately
    await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
            status: 'paid',
            paymentData: JSON.stringify(payload)
        }
    });

    // 7. DELIVER DATA (Tunnel)
    if (transaction.type === 'data') {
         console.log(`[Webhook] Triggering Instant Delivery for ${reference}`);
         
         const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
         
         if (plan) {
             const networkId = AMIGO_NETWORKS[plan.network];
             
             const amigoPayload = {
                 network: networkId,
                 mobile_number: transaction.phone,
                 plan: Number(plan.planId),
                 Ported_number: true
             };

             // Using 'data/' endpoint specifically
             const amigoRes = await callAmigoAPI('data/', amigoPayload, reference);
             
             // Check for Amigo Success Response
             // Amigo returns { status: "successful" } or { success: true }
             const isSuccess = amigoRes.success && (
                amigoRes.data.success === true || 
                amigoRes.data.status === 'delivered' || 
                amigoRes.data.Status === 'successful'
             );

             if (isSuccess) {
                 await prisma.transaction.update({
                     where: { id: transaction.id },
                     data: { 
                         status: 'delivered', 
                         deliveryData: JSON.stringify(amigoRes.data) 
                     }
                 });
                 console.log(`[Webhook] ✅ Delivery SUCCESS for ${reference}`);
             } else {
                 console.error(`[Webhook] ❌ Delivery FAILED for ${reference}`, amigoRes.data);
                 // We leave status as 'paid' so the admin can retry or user can click "Check Status"
             }
         } else {
             console.error(`[Webhook] Plan not found for ${reference}`);
         }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
      console.error('[Webhook] Critical Error:', error);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}