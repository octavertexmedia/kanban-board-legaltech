import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { canAccessProject } from '@/lib/project-access'
import { hasPermission, isClientAuth } from '@/lib/authorization'
import { ProjectMemberRole, UserKind, type Role } from '@prisma/client'

/** POST /api/projects/[id]/members — Add a user to the project (MEMBER or CLIENT seat). */
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
        if (!hasPermission(auth.role as Role, 'manage_projects')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id: projectId } = await params
        const allowed = await canAccessProject(prisma, auth, projectId)
        if (!allowed) {
            return NextResponse.json({ error: 'Forbidden or project not found' }, { status: 403 })
        }

        const body = await req.json()
        const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 })
        }

        const raw = (body.role as string | undefined)?.toUpperCase() || 'MEMBER'
        if (raw === 'OWNER') {
            return NextResponse.json(
                { error: 'Cannot assign OWNER via this API' },
                { status: 400 },
            )
        }
        let memberRole: ProjectMemberRole = ProjectMemberRole.MEMBER
        if (raw === 'CLIENT') memberRole = ProjectMemberRole.CLIENT
        else if (raw !== 'MEMBER') {
            return NextResponse.json(
                { error: 'role must be MEMBER or CLIENT' },
                { status: 400 },
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, userKind: true },
        })
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        if (memberRole === ProjectMemberRole.CLIENT && user.userKind !== UserKind.CLIENT) {
            return NextResponse.json(
                { error: 'CLIENT seat requires a user with userKind CLIENT' },
                { status: 400 },
            )
        }
        if (memberRole === ProjectMemberRole.MEMBER && user.userKind === UserKind.CLIENT) {
            return NextResponse.json(
                { error: 'Client users must be added with role CLIENT' },
                { status: 400 },
            )
        }

        try {
            const member = await prisma.projectMember.create({
                data: { projectId, userId, role: memberRole },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            avatar: true,
                            status: true,
                            userKind: true,
                        },
                    },
                },
            })
            return NextResponse.json({ member }, { status: 201 })
        } catch (e: unknown) {
            const code = (e as { code?: string })?.code
            if (code === 'P2002') {
                return NextResponse.json(
                    { error: 'User is already on this project' },
                    { status: 409 },
                )
            }
            throw e
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
