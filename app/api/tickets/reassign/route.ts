import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'

// POST /api/tickets/reassign — Bulk reassign tickets from one user to another
export async function POST(req: NextRequest) {
    try {
        const auth = getAuthFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden — Admin access required' }, { status: 403 })
        }

        const { fromUserId, toUserId } = await req.json()

        if (!fromUserId) {
            return NextResponse.json({ error: 'fromUserId is required' }, { status: 400 })
        }

        const updateData: any = {}
        if (toUserId && toUserId !== 'none') {
            updateData.assigneeId = toUserId
        } else {
            updateData.assigneeId = null
        }

        const result = await prisma.ticket.updateMany({
            where: { assigneeId: fromUserId },
            data: updateData,
        })

        await prisma.activityLog.create({
            data: {
                action: 'reassigned',
                entity: 'tickets',
                entityId: fromUserId,
                details: `Bulk reassigned ${result.count} ticket(s) from user ${fromUserId}${toUserId ? ` to user ${toUserId}` : ' (unassigned)'}`,
                userId: auth.userId,
            },
        })

        return NextResponse.json({ success: true, count: result.count })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
