import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { canAccessProject } from '@/lib/project-access'
import { isClientAuth } from '@/lib/authorization'
import { ProjectMemberRole, StatusUpdateVisibility, UserKind } from '@prisma/client'

// GET /api/projects/[id]/status-updates
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth

        const { id: projectId } = await params
        const ok = await canAccessProject(prisma, auth, projectId)
        if (!ok) {
            return NextResponse.json({ error: 'Forbidden or project not found' }, { status: 403 })
        }

        const visibilityFilter =
            (auth.userKind ?? UserKind.INTERNAL) === UserKind.CLIENT
                ? { visibility: StatusUpdateVisibility.CLIENT }
                : {}

        const updates = await prisma.projectStatusUpdate.findMany({
            where: { projectId, ...visibilityFilter },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ updates })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/projects/[id]/status-updates
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden — clients cannot post updates' }, { status: 403 })
        }

        const { id: projectId } = await params
        const ok = await canAccessProject(prisma, auth, projectId)
        if (!ok) {
            return NextResponse.json({ error: 'Forbidden or project not found' }, { status: 403 })
        }

        const body = await req.json()
        const title = (body.title as string)?.trim()
        const rawBody = (body.body as string)?.trim()
        const visibility = (body.visibility as string)?.toUpperCase() === 'INTERNAL'
            ? StatusUpdateVisibility.INTERNAL
            : StatusUpdateVisibility.CLIENT

        if (!title || !rawBody) {
            return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
        }

        const update = await prisma.projectStatusUpdate.create({
            data: {
                projectId,
                authorId: auth.userId,
                title,
                body: rawBody,
                visibility,
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
            },
        })

        const clientMembers = await prisma.projectMember.findMany({
            where: { projectId, role: ProjectMemberRole.CLIENT },
            select: { userId: true },
        })

        if (visibility === StatusUpdateVisibility.CLIENT && clientMembers.length > 0) {
            try {
                await prisma.notification.createMany({
                    data: clientMembers.map((m) => ({
                        type: 'project_status_update',
                        title: 'New project update',
                        message: title,
                        linkTo: `/projects/${projectId}`,
                        userId: m.userId,
                    })),
                })
            } catch (e) {
                console.error('Status update notification error', e)
            }
        }

        return NextResponse.json({ update }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
