import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { canAccessProject } from '@/lib/project-access'
import { isClientAuth } from '@/lib/auth'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const auth = requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden — clients cannot comment' }, { status: 403 })
        }

        const { text, content } = await req.json()
        const commentText = (content || text || '').trim()

        if (!commentText) {
            return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
        }

        const ticketRow = await prisma.ticket.findUnique({
            where: { id },
            select: {
                id: true,
                column: {
                    select: {
                        board: { select: { projectId: true } },
                    },
                },
            },
        })
        const projId = ticketRow?.column.board?.projectId
        if (!ticketRow || !projId || !(await canAccessProject(prisma, auth, projId))) {
            return NextResponse.json({ error: 'Forbidden or ticket not found' }, { status: 403 })
        }

        const comment = await prisma.comment.create({
            data: {
                text: commentText,
                userId: auth.userId,
                ticketId: id,
            },
            include: {
                user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
            },
        })

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                assignee: true,
                column: {
                    include: {
                        board: { include: { project: { select: { id: true, name: true } } } },
                    },
                },
            },
        })

        if (process.env.PUSHER_APP_ID && ticket?.column?.board?.projectId) {
            try {
                const { pusherServer } = await import('@/lib/pusher')
                await pusherServer.trigger(`project-${ticket.column.board.projectId}`, 'ticket-updated', ticket)
            } catch (e) { console.error('Pusher error', e) }
        }

        if (ticket && ticket.assigneeId && ticket.assigneeId !== auth.userId) {
            // Notify assignee
            try {
                const { notificationService } = await import('@/lib/services/notification-service')
                await notificationService.notify(
                    ticket.assignee as any,
                    "ticket_mentioned",
                    {
                        ticketId: ticket.id,
                        projectId: ticket.column?.board?.projectId,
                        projectName: ticket.column?.board?.project?.name,
                        title: ticket.title,
                        mentionedBy: comment.user,
                        commentText: comment.text,
                        mentionKind: "comment",
                    },
                    true // send email
                )
            } catch (e) {
                console.error("Failed to send comment notification", e)
            }
        }

        return NextResponse.json({ comment }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
