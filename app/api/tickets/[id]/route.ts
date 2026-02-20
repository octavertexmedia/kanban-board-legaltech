import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'

// GET /api/tickets/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                assignee: { select: { id: true, name: true, email: true, role: true, avatar: true } },
                creator: { select: { id: true, name: true, email: true, avatar: true } },
                column: {
                    select: {
                        id: true,
                        title: true,
                        board: { select: { id: true, title: true, projectId: true } },
                    },
                },
                comments: {
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                attachments: true,
                labels: { include: { label: true } },
            },
        })

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        return NextResponse.json({ ticket })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH /api/tickets/[id] — Update ticket
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const auth = getAuthFromRequest(req)
        const body = await req.json()

        const existing = await prisma.ticket.findUnique({
            where: { id },
            include: { column: { select: { title: true, board: { select: { projectId: true } } } } },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        const updateData: any = {}
        const isManagerOrAdmin = auth?.role === 'ADMIN' || auth?.role === 'MANAGER'

        if (body.assigneeId !== undefined && body.assigneeId !== existing.assigneeId) {
            if (!isManagerOrAdmin) return NextResponse.json({ error: 'Forbidden: Only managers and admins can assign tickets' }, { status: 403 })
            updateData.assigneeId = body.assigneeId || null
        }

        if (body.title !== undefined) updateData.title = body.title
        if (body.description !== undefined) updateData.description = body.description
        if (body.type !== undefined) updateData.type = body.type.toUpperCase()
        if (body.priority !== undefined) updateData.priority = body.priority.toUpperCase()
        if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
        if (body.position !== undefined) updateData.position = body.position
        if (body.timeSpent !== undefined) updateData.timeSpent = body.timeSpent

        // Handle column move (drag-and-drop)
        if (body.columnId && body.columnId !== existing.columnId) {
            if (!isManagerOrAdmin) return NextResponse.json({ error: 'Forbidden: Only managers and admins can change ticket status' }, { status: 403 })

            updateData.columnId = body.columnId

            // Get max position in target column
            const maxPos = await prisma.ticket.findFirst({
                where: { columnId: body.columnId },
                orderBy: { position: 'desc' },
                select: { position: true },
            })
            updateData.position = body.position ?? (maxPos?.position ?? -1) + 1

            // Log the status change
            if (auth) {
                const newColumn = await prisma.column.findUnique({
                    where: { id: body.columnId },
                    select: { title: true },
                })
                await prisma.activityLog.create({
                    data: {
                        action: 'moved',
                        entity: 'ticket',
                        entityId: id,
                        details: `Moved "${existing.title}" from ${existing.column.title} to ${newColumn?.title}`,
                        userId: auth.userId,
                        projectId: existing.column.board?.projectId,
                    },
                })
            }
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data: updateData,
            include: {
                assignee: { select: { id: true, name: true, email: true, role: true, avatar: true } },
                creator: { select: { id: true, name: true, avatar: true } },
                column: { select: { id: true, title: true, board: { select: { projectId: true } } } },
                labels: { include: { label: true } },
                _count: { select: { comments: true, attachments: true } },
            },
        })

        if (process.env.PUSHER_APP_ID) {
            try {
                const { pusherServer } = await import('@/lib/pusher')
                await pusherServer.trigger(`project-${ticket.column.board?.projectId}`, 'ticket-updated', ticket)
            } catch (e) { console.error('Pusher error', e) }
        }

        // Trigger Notifications (Email + DB)
        try {
            const { notificationService } = await import('@/lib/services/notification-service')
            const projectData = {
                title: ticket.title,
                ticketId: ticket.id,
                projectId: ticket.column.board?.projectId,
            }

            // If assigned to a new user
            if (updateData.assigneeId && updateData.assigneeId !== existing.assigneeId && ticket.assignee) {
                await notificationService.notify(
                    ticket.assignee as any,
                    "ticket_assigned",
                    { ...projectData, description: ticket.description, priority: ticket.priority, dueDate: ticket.dueDate, assignedBy: { name: 'A Team Member' } },
                    true
                )
            }

            // If status changed
            if (updateData.columnId && updateData.columnId !== existing.columnId && ticket.assignee) {
                await notificationService.notify(
                    ticket.assignee as any,
                    "ticket_status_change",
                    { ...projectData, oldStatus: existing.column.title, newStatus: ticket.column.title, changedBy: { name: 'A Team Member' } },
                    true
                )
            }
        } catch (e) { console.error("Notification failed", e) }

        return NextResponse.json({ ticket })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/tickets/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.ticket.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
