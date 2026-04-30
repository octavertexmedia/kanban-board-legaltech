import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'

// PATCH /api/notifications/[id]/read
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Handle "read-all"
        if (id === 'read-all') {
            const auth = await getAuthFromRequest(req)
            if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

            await prisma.notification.updateMany({
                where: { userId: auth.userId, readAt: null },
                data: { readAt: new Date() },
            })
            return NextResponse.json({ success: true })
        }

        await prisma.notification.update({
            where: { id },
            data: { readAt: new Date() },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
