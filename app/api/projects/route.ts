import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { getAccessibleProjectIds } from '@/lib/project-access'
import { isClientAuth } from '@/lib/authorization'
import { ProjectMemberRole } from '@prisma/client'

// GET /api/projects — List projects
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth

        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search')
        const status = searchParams.get('status')

        const accessibleIds = await getAccessibleProjectIds(prisma, auth)
        if (accessibleIds.length === 0) {
            return NextResponse.json({ projects: [] })
        }

        const where: any = {
            id: { in: accessibleIds },
        }
        if (status) where.status = status.toUpperCase()
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
                    },
                },
                board: {
                    include: {
                        columns: {
                            include: { _count: { select: { tickets: true } } },
                            orderBy: { position: 'asc' },
                        },
                    },
                },
                _count: { select: { activities: true } },
            },
            orderBy: { updatedAt: 'desc' },
        })

        // Compute stats for each project
        const projectsWithStats = projects.map(project => {
            const totalTickets = project.board?.columns.reduce(
                (sum, col) => sum + col._count.tickets, 0
            ) || 0
            const doneTickets = project.board?.columns
                .filter(col => col.title.toLowerCase() === 'done')
                .reduce((sum, col) => sum + col._count.tickets, 0) || 0

            return {
                ...project,
                stats: {
                    totalTickets,
                    doneTickets,
                    progress: totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0,
                    memberCount: project.members.length,
                },
            }
        })

        return NextResponse.json({ projects: projectsWithStats })
    } catch (error: any) {
        console.error('GET /api/projects error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/projects — Create project
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden — clients cannot create projects' }, { status: 403 })
        }

        const { name, description, memberIds } = await req.json()

        if (!name) {
            return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
        }

        // Ensure creator is not duplicated in memberIds to prevent Unique Constraint Failure
        const uniqueMemberIds = (Array.from(new Set(memberIds || [])) as string[])
            .filter((id) => id !== auth?.userId);

        const project = await prisma.project.create({
            data: {
                name,
                description: description || '',
                members: {
                    create: [
                        { userId: auth.userId, role: ProjectMemberRole.OWNER },
                        ...uniqueMemberIds.map((id: string) => ({ userId: id, role: ProjectMemberRole.MEMBER })),
                    ],
                },
                board: {
                    create: {
                        title: `${name} Board`,
                        columns: {
                            create: [
                                { title: 'To Do', position: 0, color: '#6366f1' },
                                { title: 'Backlog', position: 1, color: '#94a3b8' },
                                { title: 'In Progress', position: 2, color: '#f59e0b' },
                                { title: 'Review', position: 3, color: '#8b5cf6' },
                                { title: 'Done', position: 4, color: '#10b981' },
                            ],
                        },
                    },
                },
            },
            include: {
                members: {
                    include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
                },
                board: { include: { columns: { orderBy: { position: 'asc' } } } },
            },
        })

        if (auth) {
            await prisma.activityLog.create({
                data: {
                    action: 'created',
                    entity: 'project',
                    entityId: project.id,
                    details: `Created project "${name}"`,
                    userId: auth.userId,
                    projectId: project.id,
                },
            })
        }

        return NextResponse.json({ project }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
