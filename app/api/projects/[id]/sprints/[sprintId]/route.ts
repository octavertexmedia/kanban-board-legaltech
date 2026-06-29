import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { canAccessProject } from '@/lib/project-access'
import { hasPermission, isClientAuth } from '@/lib/authorization'
import { SprintStatus } from '@prisma/client'

// PATCH /api/projects/[id]/sprints/[sprintId]
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; sprintId: string }> },
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

        const { id: projectId, sprintId } = await params
        if (!(await canAccessProject(prisma, auth, projectId))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const existing = await prisma.sprint.findFirst({
            where: { id: sprintId, projectId },
        })
        if (!existing) {
            return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
        }

        const body = await req.json()
        const data: {
            name?: string
            goal?: string | null
            startDate?: Date
            endDate?: Date
            status?: SprintStatus
        } = {}

        if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
        if (body.goal !== undefined) data.goal = typeof body.goal === 'string' ? body.goal.trim() || null : null
        if (body.startDate) {
            const d = new Date(body.startDate)
            if (!Number.isNaN(d.getTime())) data.startDate = d
        }
        if (body.endDate) {
            const d = new Date(body.endDate)
            if (!Number.isNaN(d.getTime())) data.endDate = d
        }
        if (body.status === 'PLANNED' || body.status === 'ACTIVE' || body.status === 'COMPLETED') {
            data.status = body.status
        }

        const sprint = await prisma.$transaction(async (tx) => {
            if (data.status === 'ACTIVE') {
                await tx.sprint.updateMany({
                    where: { projectId, status: 'ACTIVE', id: { not: sprintId } },
                    data: { status: 'PLANNED' },
                })
            }
            return tx.sprint.update({
                where: { id: sprintId },
                data,
                include: { _count: { select: { tickets: true } } },
            })
        })

        return NextResponse.json({ sprint })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// DELETE /api/projects/[id]/sprints/[sprintId]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; sprintId: string }> },
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

        const { id: projectId, sprintId } = await params
        if (!(await canAccessProject(prisma, auth, projectId))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const existing = await prisma.sprint.findFirst({
            where: { id: sprintId, projectId },
        })
        if (!existing) {
            return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })
        }

        await prisma.sprint.delete({ where: { id: sprintId } })

        return NextResponse.json({ ok: true })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
