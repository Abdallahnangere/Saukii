import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, planId, password } = body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const plan = await prisma.dataPlan.findUnique({ where: { id: planId } });
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

        const networkId = AMIGO_NETWORKS[plan.network];
        const idempotencyKey = `MANUAL-${uuidv4()}`;
        
        const amigoPayload = {
            network: networkId,
            mobile_number: phone,
            plan: Number(plan.planId),
            Ported_number: true
        };

        // Call Tunnel
        const amigoRes = await callAmigoAPI('/data/', amigoPayload, idempotencyKey);

        const tx_ref = idempotencyKey;
        const isSuccess = amigoRes.success && (amigoRes.data.success === true || amigoRes.data.status === 'delivered');
        
        const transaction = await prisma.transaction.create({
            data: {
                tx_ref,
                idempotencyKey:tx_ref,
                type: 'data',
                status: isSuccess ? 'delivered' : 'failed',
                phone,
                amount: 0,
                planId: plan.id,
                deliveryData: amigoRes.data,
                paymentData: { method: 'Manual Admin Topup' }
            }
        });

        if (!isSuccess) {
            return NextResponse.json({ error: 'Tunnel Delivery Failed', details: amigoRes.data }, { status: 400 });
        }

        return NextResponse.json({ success: true, transaction });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}
