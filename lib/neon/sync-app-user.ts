import { randomBytes } from 'node:crypto'
import prisma from '@/lib/db'
import { hashPassword } from '@/lib/authorization'
import { neonAuth } from '@/lib/neon/server'
import { UserKind, type Role } from '@prisma/client'

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
        await prisma.user.update({
            where: { id: existing.id },
            data: { lastActive: new Date() },
        })
        return existing
    }

    const placeholderPassword = await hashPassword(randomBytes(32).toString('hex'))
    const name = sessionUser.name?.trim() || email.split('@')[0] || 'User'

    return prisma.user.create({
        data: {
            email,
            name,
            password: placeholderPassword,
            role: defaults?.role ?? 'ENGINEER',
            userKind: defaults?.userKind ?? UserKind.INTERNAL,
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
}

/** Load Neon session then return Prisma user (or null). */
export async function getSessionAppUser() {
    const { data: session } = await neonAuth.getSession()
    const su = session?.user
    if (!su?.email) return { session: null, user: null as Awaited<ReturnType<typeof ensureAppUserFromNeonSession>> }
    const user = await ensureAppUserFromNeonSession(su)
    return { session, user }
}
