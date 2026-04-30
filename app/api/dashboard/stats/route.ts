import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { getAccessibleProjectIds, hasGlobalProjectAccess } from '@/lib/project-access'
import { isClientAuth } from '@/lib/auth'

// GET /api/dashboard/stats — Get all dashboard stats (scoped to accessible projects)
export async function GET(req: NextRequest) {
    try {
        const auth = requireAuth(req)
        if (auth instanceof NextResponse) return auth

        const accessibleIds = await getAccessibleProjectIds(prisma, auth)
        const ids = accessibleIds.length ? accessibleIds : ['__none__']
        const ticketScope = { column: { board: { projectId: { in: ids } } } }

        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

        const client = isClientAuth(auth)

        const [
            totalProjects,
            activeProjects,
            totalTickets,
            doneTickets,
            highPriorityTickets,
            urgentTickets,
            totalUsers,
            activeUsers,
            totalMeetings,
            upcomingMeetings,
            totalArticles,
        ] = await Promise.all([
            prisma.project.count({ where: { id: { in: ids } } }),
            prisma.project.count({ where: { id: { in: ids }, status: 'ACTIVE' } }),
            prisma.ticket.count({ where: ticketScope }),
            prisma.ticket.count({
                where: {
                    AND: [
                        ticketScope,
                        { column: { title: { equals: 'Done', mode: 'insensitive' } } },
                    ],
                },
            }),
            prisma.ticket.count({ where: { AND: [ticketScope, { priority: 'HIGH' }] } }),
            prisma.ticket.count({ where: { AND: [ticketScope, { priority: 'URGENT' }] } }),
            client ? Promise.resolve(0) : prisma.user.count(),
            client ? Promise.resolve(0) : prisma.user.count({ where: { status: 'ACTIVE' } }),
            client ? Promise.resolve(0) : prisma.meeting.count(),
            client ? Promise.resolve(0) : prisma.meeting.count({ where: { startTime: { gte: now } } }),
            client ? Promise.resolve(0) : prisma.knowledgeArticle.count(),
        ])

        const [thisWeekTickets, lastWeekTickets, thisWeekActivities] = await Promise.all([
            prisma.ticket.count({
                where: { AND: [ticketScope, { createdAt: { gte: weekAgo } }] },
            }),
            prisma.ticket.count({
                where: {
                    AND: [
                        ticketScope,
                        { createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
                    ],
                },
            }),
            client
                ? Promise.resolve(0)
                : prisma.activityLog.count({ where: { createdAt: { gte: weekAgo } } }),
        ])

        const ticketTrend =
            lastWeekTickets > 0
                ? Math.round(((thisWeekTickets - lastWeekTickets) / lastWeekTickets) * 100)
                : thisWeekTickets > 0
                  ? 100
                  : 0

        const columns = await prisma.column.findMany({
            where: { board: { projectId: { in: ids } } },
            select: {
                title: true,
                color: true,
                _count: { select: { tickets: true } },
            },
        })

        const ticketsByStatus = columns.reduce((acc: any[], col) => {
            const existing = acc.find((a) => a.name === col.title)
            if (existing) {
                existing.value += col._count.tickets
            } else {
                acc.push({
                    name: col.title,
                    value: col._count.tickets,
                    color: col.color || '#6366f1',
                })
            }
            return acc
        }, [])

        const ticketsByPriority = await Promise.all(
            ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(async (p) => ({
                name: p.charAt(0) + p.slice(1).toLowerCase(),
                value: await prisma.ticket.count({
                    where: { AND: [ticketScope, { priority: p as any }] },
                }),
                color:
                    p === 'URGENT'
                        ? '#ef4444'
                        : p === 'HIGH'
                          ? '#f59e0b'
                          : p === 'MEDIUM'
                            ? '#3b82f6'
                            : '#10b981',
            }))
        )

        const ticketsByType = await Promise.all(
            ['FEATURE', 'BUG', 'TASK', 'RESEARCH', 'LEGAL_REVIEW', 'CLIENT_INTAKE'].map(async (t) => ({
                name: t.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                value: await prisma.ticket.count({
                    where: { AND: [ticketScope, { type: t as any }] },
                }),
            }))
        )

        const activityByDay: { name: string; tickets: number; comments: number }[] = []
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now)
            dayStart.setDate(dayStart.getDate() - i)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(dayStart)
            dayEnd.setDate(dayEnd.getDate() + 1)

            const [tickets, comments] = await Promise.all([
                prisma.ticket.count({
                    where: { AND: [ticketScope, { createdAt: { gte: dayStart, lt: dayEnd } }] },
                }),
                prisma.comment.count({
                    where: {
                        createdAt: { gte: dayStart, lt: dayEnd },
                        ticket: { column: { board: { projectId: { in: ids } } } },
                    },
                }),
            ])

            activityByDay.push({
                name: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
                tickets,
                comments,
            })
        }

        const activityWhere: any = hasGlobalProjectAccess(auth)
            ? {}
            : { projectId: { in: ids } }

        const recentActivity = await prisma.activityLog.findMany({
            where: activityWhere,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                project: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })

        const teamWorkload = client
            ? []
            : await prisma.user.findMany({
                  where: { status: 'ACTIVE' },
                  select: {
                      id: true,
                      name: true,
                      avatar: true,
                      role: true,
                      _count: {
                          select: { assignedTickets: true },
                      },
                  },
                  orderBy: { name: 'asc' },
              })

        return NextResponse.json({
            stats: {
                totalProjects,
                activeProjects,
                totalTickets,
                doneTickets,
                completionRate: totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0,
                highPriorityTickets,
                urgentTickets,
                totalUsers,
                activeUsers,
                totalMeetings,
                upcomingMeetings,
                totalArticles,
                thisWeekTickets,
                ticketTrend,
                thisWeekActivities,
            },
            charts: {
                ticketsByStatus,
                ticketsByPriority,
                ticketsByType: ticketsByType.filter((t) => t.value > 0),
                activityByDay,
                teamWorkload: teamWorkload.map((u) => ({
                    name: u.name,
                    tickets: u._count.assignedTickets,
                    avatar: u.avatar,
                    role: u.role,
                })),
            },
            recentActivity,
        })
    } catch (error: any) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
