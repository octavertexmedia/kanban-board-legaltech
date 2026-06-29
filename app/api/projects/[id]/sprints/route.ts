import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { canAccessProject } from '@/lib/project-access'
import { hasPermission, isClientAuth } from '@/lib/authorization'
import { SprintStatus } from '@prisma/client'

// GET /api/projects/[id]/sprints
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth

        const { id: projectId } = await params
        if (!(await canAccessProject(prisma, auth, projectId))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const sprints = await prisma.sprint.findMany({
            where: { projectId },
            include: { _count: { select: { tickets: true } } },
            orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
        })

        return NextResponse.json({ sprints })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// POST /api/projects/[id]/sprints
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        if (!hasPermission(auth.role, 'manage_projects')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id: projectId } = await params
        if (!(await canAccessProject(prisma, auth, projectId))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        if (!name) {
            return NextResponse.json({ error: 'Sprint name is required' }, { status: 400 })
        }

        const startDate = body.startDate ? new Date(body.startDate) : new Date()
        const endDate = body.endDate
            ? new Date(body.endDate)
            : new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000)

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return NextResponse.json({ error: 'Invalid sprint dates' }, { status: 400 })
        }

        let status: SprintStatus = 'PLANNED'
        if (body.status === 'ACTIVE') status = 'ACTIVE'
        else if (body.status === 'COMPLETED') status = 'COMPLETED'

        const sprint = await prisma.$transaction(async (tx) => {
            if (status === 'ACTIVE') {
                await tx.sprint.updateMany({
                    where: { projectId, status: 'ACTIVE' },
                    data: { status: 'PLANNED' },
                })
            }

            return tx.sprint.create({
                data: {
                    projectId,
                    name,
                    goal: typeof body.goal === 'string' ? body.goal.trim() || null : null,
                    startDate,
                    endDate,
                    status,
                },
                include: { _count: { select: { tickets: true } } },
            })
        })

        return NextResponse.json({ sprint }, { status: 201 })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
