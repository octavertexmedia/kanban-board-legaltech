import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { canAccessProject } from '@/lib/project-access'
import { hasPermission, isClientAuth } from '@/lib/authorization'
import { ProjectMemberRole, type Role } from '@prisma/client'

/** DELETE /api/projects/[id]/members/[userId] — Remove a user from the project. */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> },
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

        const { id: projectId, userId } = await params
        const allowed = await canAccessProject(prisma, auth, projectId)
        if (!allowed) {
            return NextResponse.json({ error: 'Forbidden or project not found' }, { status: 403 })
        }

        const member = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId },
            },
            select: { id: true, role: true },
        })
        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        if (member.role === ProjectMemberRole.OWNER) {
            const owners = await prisma.projectMember.count({
                where: { projectId, role: ProjectMemberRole.OWNER },
            })
            if (owners <= 1) {
                return NextResponse.json(
                    { error: 'Cannot remove the only project owner' },
                    { status: 400 },
                )
            }
        }

        await prisma.projectMember.delete({ where: { id: member.id } })
        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
