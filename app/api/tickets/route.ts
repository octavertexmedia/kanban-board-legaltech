import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'

// GET /api/tickets — List tickets with filters
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const columnId = searchParams.get('columnId')
        const assigneeId = searchParams.get('assigneeId')
        const priority = searchParams.get('priority')
        const type = searchParams.get('type')
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: any = {}

        if (columnId) where.columnId = columnId
        if (assigneeId) where.assigneeId = assigneeId
        if (priority) where.priority = priority.toUpperCase()
        if (type) where.type = type.toUpperCase()

        if (projectId) {
            where.column = { board: { projectId } }
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                include: {
                    assignee: { select: { id: true, name: true, email: true, role: true, avatar: true } },
                    creator: { select: { id: true, name: true, avatar: true } },
                    column: { select: { id: true, title: true } },
                    labels: { include: { label: true } },
                    _count: { select: { comments: true, attachments: true } },
                },
                orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.ticket.count({ where }),
        ])

        return NextResponse.json({
            tickets,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
    } catch (error: any) {
        console.error('GET /api/tickets error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/tickets — Create ticket
export async function POST(req: NextRequest) {
    try {
        const auth = getAuthFromRequest(req)
        const body = await req.json()

        const { title, description, type, priority, dueDate, columnId, assigneeId, labelIds } = body

        if (!title || !columnId) {
            return NextResponse.json(
                { error: 'Title and columnId are required' },
                { status: 400 }
            )
        }

        // Get max position in column
        const maxPos = await prisma.ticket.findFirst({
            where: { columnId },
            orderBy: { position: 'desc' },
            select: { position: true },
        })

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description: description || '',
                type: type?.toUpperCase() || 'TASK',
                priority: priority?.toUpperCase() || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                position: (maxPos?.position ?? -1) + 1,
                columnId,
                assigneeId: assigneeId || null,
                creatorId: auth?.userId || null,
                labels: labelIds?.length
                    ? { create: labelIds.map((id: string) => ({ labelId: id })) }
                    : undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true, role: true, avatar: true } },
                creator: { select: { id: true, name: true, avatar: true } },
                column: { select: { id: true, title: true, board: { select: { projectId: true } } } },
                labels: { include: { label: true } },
                _count: { select: { comments: true, attachments: true } },
            },
        })

        // Log activity
        if (auth) {
            await prisma.activityLog.create({
                data: {
                    action: 'created',
                    entity: 'ticket',
                    entityId: ticket.id,
                    details: `Created ticket "${title}"`,
                    userId: auth.userId,
                    projectId: ticket.column.board?.projectId,
                },
            })
        }

        if (process.env.PUSHER_APP_ID) {
            try {
                const { pusherServer } = await import('@/lib/pusher')
                await pusherServer.trigger(`project-${ticket.column.board?.projectId}`, 'ticket-created', ticket)
            } catch (e) { console.error('Pusher error', e) }
        }

        return NextResponse.json({ ticket }, { status: 201 })
    } catch (error: any) {
        console.error('POST /api/tickets error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
