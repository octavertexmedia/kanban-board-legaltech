import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const auth = getAuthFromRequest(req)
        const { text, content } = await req.json()
        const commentText = (content || text || '').trim()

        if (!commentText) {
            return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
        }

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
                column: { include: { board: true } }
            }
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
                        title: ticket.title,
                        mentionedBy: comment.user,
                        commentText: comment.text
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
