import type { PrismaClient } from '@prisma/client'
import { UserKind, ProjectMemberRole } from '@prisma/client'
import type { JWTPayload } from '@/lib/authorization'

export function hasGlobalProjectAccess(payload: JWTPayload): boolean {
    return payload.role === 'SUPER_ADMIN' || payload.role === 'ADMIN'
}

export async function getAccessibleProjectIds(
    prisma: PrismaClient,
    payload: JWTPayload
): Promise<string[]> {
    if (hasGlobalProjectAccess(payload)) {
        const all = await prisma.project.findMany({ select: { id: true } })
        return all.map((p) => p.id)
    }

    const userKind = payload.userKind ?? UserKind.INTERNAL

    if (userKind === UserKind.CLIENT) {
        const rows = await prisma.projectMember.findMany({
            where: { userId: payload.userId, role: ProjectMemberRole.CLIENT },
            select: { projectId: true },
        })
        return rows.map((r) => r.projectId)
    }

    const rows = await prisma.projectMember.findMany({
        where: { userId: payload.userId },
        select: { projectId: true },
    })
    return [...new Set(rows.map((r) => r.projectId))]
}

export async function canAccessProject(
    prisma: PrismaClient,
    payload: JWTPayload,
    projectId: string
): Promise<boolean> {
    const ids = await getAccessibleProjectIds(prisma, payload)
    return ids.includes(projectId)
}
