import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'

// POST /api/notifications/mark-all-read
export async function POST(req: NextRequest) {
    try {
        const auth = await getAuthFromRequest(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await prisma.notification.updateMany({
            where: { userId: auth.userId, readAt: null },
            data: { readAt: new Date() },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
