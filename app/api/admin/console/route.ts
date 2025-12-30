import { NextResponse } from 'next/server';
import { callAmigoAPI } from '../../../../lib/amigo';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { endpoint, payload, password } = body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const idempotencyKey = `CONSOLE-${Date.now()}`;
        
        // Pass to Tunnel
        const result = await callAmigoAPI(endpoint, payload, idempotencyKey);

        // SAVE TO DB if it's a data transaction
        if (result.success && payload.mobile_number && payload.plan) {
            try {
                // Try to find a matching plan in DB to link it, or just leave it null
                const plan = await prisma.dataPlan.findFirst({ where: { planId: Number(payload.plan) } });
                
                await prisma.transaction.create({
                    data: {
                        tx_ref: idempotencyKey,
                        type: 'console_data', // Special type
                        status: 'delivered',
                        phone: payload.mobile_number,
                        amount: plan ? plan.price : 0, // Default to 0 if plan not found, admin can override in receipt
                        planId: plan ? plan.id : undefined,
                        deliveryData: JSON.stringify(result.data),
                        paymentData: JSON.stringify({ method: 'Admin Console' })
                    }
                });
            } catch (err) {
                console.error("Failed to save console transaction", err);
            }
        }

        return NextResponse.json(result.data, { status: result.status });

    } catch (e: any) {
        return NextResponse.json(
            { error: e.message }, 
            { status: 500 }
        );
    }
}