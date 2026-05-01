import { UserKind } from '@prisma/client'

/**
 * Workspace bootstrap admins: Prisma `User.role` is set to ADMIN for these emails
 * on sign-in/session resolution (see ensureAppUserFromNeonSession).
 *
 * - Comma-separated `DEFAULT_WORKSPACE_ADMIN_EMAILS`
 * - Single `DEFAULT_WORKSPACE_ADMIN_EMAIL`
 * - Built-in org owner (OctaVertex Media production account)
 *
 * Neon Auth `emailVerified` is managed in Neon; this file only updates app RBAC.
 */
const BUILTIN_ADMIN_EMAILS = [
    'octavertexmedia@gmail.com',
    'manish@octavertexmedia.com',
] as const

export function getWorkspaceBootstrapAdminEmails(): Set<string> {
    const out = new Set<string>(
        BUILTIN_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()),
    )
    const single = process.env.DEFAULT_WORKSPACE_ADMIN_EMAIL?.trim().toLowerCase()
    if (single) out.add(single)
    const multi = process.env.DEFAULT_WORKSPACE_ADMIN_EMAILS
    if (multi) {
        for (const part of multi.split(',')) {
            const e = part.trim().toLowerCase()
            if (e) out.add(e)
        }
    }
    return out
}

export function isWorkspaceBootstrapAdminEmail(email: string): boolean {
    return getWorkspaceBootstrapAdminEmails().has(email.toLowerCase().trim())
}

/** Roles we never overwrite when promoting bootstrap admins. */
const PROTECTED_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

export function shouldPromoteToBootstrapAdmin(
    email: string,
    currentRole: string,
    userKind: UserKind,
): boolean {
    if (userKind === UserKind.CLIENT) return false
    if (PROTECTED_ROLES.has(currentRole)) return false
    return isWorkspaceBootstrapAdminEmail(email)
}
