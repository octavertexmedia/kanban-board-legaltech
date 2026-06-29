import { randomBytes } from 'node:crypto'
import prisma from '@/lib/db'
import { hashPassword } from '@/lib/authorization'
import { neonAuth } from '@/lib/neon/server'
import { UserKind, type Role } from '@prisma/client'
import {
    isWorkspaceBootstrapAdminEmail,
    shouldPromoteToBootstrapAdmin,
} from '@/lib/neon/workspace-admin-bootstrap'

type SessionUser = { email?: string | null; name?: string | null }

/**
 * Ensures a Prisma `User` exists for the current Neon Auth session (join key: email).
 * Used after sign-in / sign-up and when resolving `/api/auth/session`.
 */
export async function ensureAppUserFromNeonSession(
    sessionUser: SessionUser,
    defaults?: { role?: Role; userKind?: UserKind },
) {
    const email = sessionUser.email?.toLowerCase()?.trim()
    if (!email) return null

    const existing = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            userKind: true,
            status: true,
            avatar: true,
            lastActive: true,
        },
    })
    if (existing) {
        if (shouldPromoteToBootstrapAdmin(email, existing.role, existing.userKind)) {
            const upgraded = await prisma.user.update({
                where: { id: existing.id },
                data: {
                    lastActive: new Date(),
                    role: 'ADMIN',
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    userKind: true,
                    status: true,
                    avatar: true,
                    lastActive: true,
                },
            })
            await prisma.activityLog
                .create({
                    data: {
                        action: 'updated',
                        entity: 'user',
                        entityId: upgraded.id,
                        details: `Bootstrap: promoted ${email} to ADMIN (workspace default admin list)`,
                        userId: upgraded.id,
                    },
                })
                .catch(() => {})
            return upgraded
        }

        await prisma.user.update({
            where: { id: existing.id },
            data: { lastActive: new Date() },
        })
        return existing
    }

    const placeholderPassword = await hashPassword(randomBytes(32).toString('hex'))
    const allowSignup = process.env.ALLOW_PUBLIC_SIGNUP === 'true'
    const name = sessionUser.name?.trim() || email.split('@')[0] || 'User'

    const role: Role =
        defaults?.role ??
        (isWorkspaceBootstrapAdminEmail(email) ? 'ADMIN' : allowSignup ? 'ENGINEER' : 'VIEWER')

    const status = isWorkspaceBootstrapAdminEmail(email) || allowSignup ? 'ACTIVE' : 'PENDING'

    return prisma.user.create({
        data: {
            email,
            name,
            password: placeholderPassword,
            role,
            userKind: defaults?.userKind ?? UserKind.INTERNAL,
            status,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            userKind: true,
            status: true,
            avatar: true,
            lastActive: true,
        },
    })
}

/** Load Neon session then return Prisma user (or null). */
export async function getSessionAppUser() {
    const { data: session } = await neonAuth.getSession()
    const su = session?.user
    if (!su?.email) return { session: null, user: null as Awaited<ReturnType<typeof ensureAppUserFromNeonSession>> }
    const user = await ensureAppUserFromNeonSession(su)
    return { session, user }
}
