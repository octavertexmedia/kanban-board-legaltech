import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { getAccessibleProjectIds } from '@/lib/project-access'
import { isClientAuth } from '@/lib/authorization'

// GET /api/search?q=query — Full-text search across all entities
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth

        const accessibleIds = await getAccessibleProjectIds(prisma, auth)
        const projectScope =
            accessibleIds.length > 0
                ? { column: { board: { projectId: { in: accessibleIds } } } }
                : { column: { board: { projectId: '__none__' } } }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q')?.trim()
        const type = searchParams.get('type') // filter by type: ticket, project, article, user, meeting
        const limit = parseInt(searchParams.get('limit') || '20')

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [], total: 0 })
        }

        const results: any[] = []

        // ─── Search Tickets ─────────────────────────────────
        if (!type || type === 'ticket') {
            const tickets = await prisma.ticket.findMany({
                where: {
                    AND: [
                        projectScope,
                        {
                            OR: [
                                { title: { contains: query, mode: 'insensitive' } },
                                { description: { contains: query, mode: 'insensitive' } },
                            ],
                        },
                    ],
                },
                include: {
                    assignee: { select: { id: true, name: true, avatar: true } },
                    column: {
                        select: {
                            title: true,
                            board: { select: { projectId: true, project: { select: { name: true } } } },
                        },
                    },
                },
                take: limit,
                orderBy: { updatedAt: 'desc' },
            })

            tickets.forEach(ticket => {
                results.push({
                    id: ticket.id,
                    type: 'ticket',
                    title: ticket.title,
                    subtitle: `${ticket.column.board.project.name} • ${ticket.column.title}`,
                    description: ticket.description?.substring(0, 120) || '',
                    url: `/projects/${ticket.column.board.projectId}?ticket=${ticket.id}`,
                    priority: ticket.priority,
                    metadata: {
                        assignee: ticket.assignee?.name,
                        status: ticket.column.title,
                        project: ticket.column.board.project.name,
                    },
                })
            })
        }

        // ─── Search Projects ────────────────────────────────
        if (!type || type === 'project') {
            const projects = await prisma.project.findMany({
                where: {
                    id: { in: accessibleIds.length ? accessibleIds : ['__none__'] },
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                    ],
                },
                include: {
                    _count: { select: { members: true } },
                },
                take: limit,
                orderBy: { updatedAt: 'desc' },
            })

            projects.forEach(project => {
                results.push({
                    id: project.id,
                    type: 'project',
                    title: project.name,
                    subtitle: `${project._count.members} members • ${project.status}`,
                    description: project.description?.substring(0, 120) || '',
                    url: `/projects/${project.id}`,
                    metadata: {
                        status: project.status,
                        members: project._count.members,
                    },
                })
            })
        }

        // ─── Search Knowledge Articles ──────────────────────
        if ((!type || type === 'article') && !isClientAuth(auth)) {
            const articles = await prisma.knowledgeArticle.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { content: { contains: query, mode: 'insensitive' } },
                        { tags: { hasSome: [query.toLowerCase()] } },
                    ],
                },
                include: {
                    author: { select: { name: true, avatar: true } },
                },
                take: limit,
                orderBy: { views: 'desc' },
            })

            articles.forEach(article => {
                results.push({
                    id: article.id,
                    type: 'article',
                    title: article.title,
                    subtitle: `${article.category} • ${article.views} views`,
                    description: article.content.substring(0, 120),
                    url: `/knowledge/${article.id}`,
                    metadata: {
                        category: article.category,
                        author: article.author.name,
                        views: article.views,
                    },
                })
            })
        }

        // ─── Search Users ───────────────────────────────────
        if ((!type || type === 'user') && !isClientAuth(auth)) {
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    avatar: true,
                },
                take: limit,
            })

            users.forEach(user => {
                results.push({
                    id: user.id,
                    type: 'user',
                    title: user.name,
                    subtitle: `${user.role} • ${user.email}`,
                    description: '',
                    url: `/users?highlight=${user.id}`,
                    metadata: {
                        role: user.role,
                        email: user.email,
                        status: user.status,
                    },
                })
            })
        }

        // ─── Search Meetings ────────────────────────────────
        if ((!type || type === 'meeting') && !isClientAuth(auth)) {
            const meetings = await prisma.meeting.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                    ],
                },
                include: {
                    organizer: { select: { name: true } },
                    _count: { select: { attendees: true } },
                },
                take: limit,
                orderBy: { startTime: 'desc' },
            })

            meetings.forEach(meeting => {
                const dateStr = new Date(meeting.startTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })
                results.push({
                    id: meeting.id,
                    type: 'meeting',
                    title: meeting.title,
                    subtitle: `${dateStr} • ${meeting._count.attendees} attendees`,
                    description: meeting.description?.substring(0, 120) || '',
                    url: '/meetings',
                    metadata: {
                        organizer: meeting.organizer.name,
                        date: meeting.startTime,
                        attendees: meeting._count.attendees,
                    },
                })
            })
        }

        // Sort by relevance (title exact match first)
        results.sort((a, b) => {
            const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
            const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
            return bExact - aExact
        })

        return NextResponse.json({
            results: results.slice(0, limit),
            total: results.length,
            query,
        })
    } catch (error: any) {
        console.error('Search error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
