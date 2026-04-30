import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { canAccessProject } from '@/lib/project-access'
import { isClientAuth } from '@/lib/auth'

// GET /api/tickets/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = requireAuth(req)
        if (auth instanceof NextResponse) return auth

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

        const pid = ticket.column.board?.projectId
        if (!pid || !(await canAccessProject(prisma, auth, pid))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        const auth = requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden — clients cannot edit tickets' }, { status: 403 })
        }

        const body = await req.json()

        const existing = await prisma.ticket.findUnique({
            where: { id },
            include: { column: { select: { title: true, board: { select: { projectId: true } } } } },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        const epId = existing.column.board?.projectId
        if (!epId || !(await canAccessProject(prisma, auth, epId))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updateData: any = {}
        const isManagerOrAdmin =
            auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN' || auth.role === 'MANAGER'

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

            const targetCol = await prisma.column.findUnique({
                where: { id: body.columnId },
                select: {
                    board: { select: { projectId: true } },
                },
            })
            if (targetCol?.board?.projectId !== epId) {
                return NextResponse.json({ error: 'Cannot move ticket to a different project' }, { status: 400 })
            }

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

        // Create DB notifications for assignee
        try {
            const { notificationService } = await import('@/lib/services/notification-service')
            const projectData = {
                title: ticket.title,
                ticketId: ticket.id,
                projectId: ticket.column.board?.projectId,
            }

            // If assigned to a new user, notify them
            if (updateData.assigneeId && updateData.assigneeId !== existing.assigneeId && ticket.assignee) {
                await prisma.notification.create({
                    data: {
                        type: 'ticket_assigned',
                        title: 'Ticket Assigned to You',
                        message: `You have been assigned "${ticket.title}"`,
                        linkTo: `/projects/${ticket.column.board?.projectId}`,
                        userId: ticket.assignee.id,
                    }
                })
                await notificationService.notify(
                    ticket.assignee as any,
                    "ticket_assigned",
                    { ...projectData, description: ticket.description, priority: ticket.priority, dueDate: ticket.dueDate, assignedBy: { name: 'A Team Member' } },
                    true
                )
            }

            // If status/column changed, notify assignee
            if (updateData.columnId && updateData.columnId !== existing.columnId && ticket.assignee) {
                await prisma.notification.create({
                    data: {
                        type: 'ticket_status_changed',
                        title: 'Ticket Status Updated',
                        message: `"${ticket.title}" moved from ${existing.column.title} to ${ticket.column.title}`,
                        linkTo: `/projects/${ticket.column.board?.projectId}`,
                        userId: ticket.assignee.id,
                    }
                })
                await notificationService.notify(
                    ticket.assignee as any,
                    "ticket_status_change",
                    { ...projectData, oldStatus: existing.column.title, newStatus: ticket.column.title, changedBy: { name: 'A Team Member' } },
                    true
                )
            }
        } catch (e) { console.error("Notification creation failed", e) }

        return NextResponse.json({ ticket })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/tickets/[id] — Only ADMIN/SUPER_ADMIN can delete
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const auth = requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden — only Admins can delete tickets' }, { status: 403 })
        }

        const existing = await prisma.ticket.findUnique({
            where: { id },
            select: {
                title: true,
                column: {
                    select: {
                        board: { select: { projectId: true } },
                    },
                },
            },
        })
        if (!existing) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        const dpId = existing.column.board?.projectId
        if (!dpId || !(await canAccessProject(prisma, auth, dpId))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.ticket.delete({ where: { id } })

        await prisma.activityLog.create({
            data: {
                action: 'deleted',
                entity: 'ticket',
                entityId: id,
                details: `Deleted ticket "${existing.title}"`,
                userId: auth.userId,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
