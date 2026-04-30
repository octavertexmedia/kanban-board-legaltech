import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'

// GET /api/notifications
export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const unreadOnly = searchParams.get('unread') === 'true'

        const where: any = { userId: auth.userId }
        if (unreadOnly) where.readAt = null

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prisma.notification.count({
                where: { userId: auth.userId, readAt: null },
            }),
        ])

        return NextResponse.json({ notifications, unreadCount })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
