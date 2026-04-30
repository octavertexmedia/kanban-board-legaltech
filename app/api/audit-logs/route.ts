import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'
import { isClientAuth } from '@/lib/auth'

// GET /api/audit-logs
export async function GET(req: NextRequest) {
    try {
        const auth = getAuthFromRequest(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Only SUPER_ADMIN can view audit logs
        if (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden — Admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const action = searchParams.get('action')
        const entity = searchParams.get('entity')
        const userId = searchParams.get('userId')
        const search = searchParams.get('search')

        const where: any = {}
        if (action) where.action = action
        if (entity) where.entity = entity
        if (userId) where.userId = userId
        if (search) {
            where.details = { contains: search, mode: 'insensitive' }
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.activityLog.count({ where }),
        ])

        return NextResponse.json({
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
