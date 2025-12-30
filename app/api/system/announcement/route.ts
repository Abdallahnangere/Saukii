import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'settings' } });
        return NextResponse.json(settings || { isActive: false });
    } catch (e) {
        return NextResponse.json({ isActive: false });
    }
}

export async function POST(req: Request) {
    try {
        const { password, message, isActive } = await req.json();
        
        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'settings' },
            update: { announcement: message, isActive },
            create: { id: 'settings', announcement: message, isActive }
        });

        return NextResponse.json(settings);
    } catch (e) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}