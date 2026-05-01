import bcrypt from 'bcryptjs'
import { Role, UserKind } from '@prisma/client'

/** Application auth payload (formerly JWT claims); resolved from Neon session + Prisma User. */
export interface JWTPayload {
    userId: string
    email: string
    role: Role
    userKind?: UserKind
    iat?: number
    exp?: number
}

export function isClientAuth(payload: JWTPayload): boolean {
    return (payload.userKind ?? UserKind.INTERNAL) === UserKind.CLIENT
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

export const ROLE_HIERARCHY: Role[] = [
    'VIEWER',
    'ENGINEER',
    'DESIGNER',
    'RESEARCHER',
    'MANAGER',
    'ADMIN',
    'SUPER_ADMIN',
]

export function getRoleLevel(role: Role): number {
    return ROLE_HIERARCHY.indexOf(role)
}

export function isRoleHigherOrEqual(userRole: Role, requiredRole: Role): boolean {
    return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
    SUPER_ADMIN: [
        'manage_users', 'manage_projects', 'manage_tickets', 'manage_meetings',
        'manage_knowledge', 'manage_settings', 'view_analytics', 'delete_anything',
        'manage_roles', 'export_data', 'create_admins', 'manage_system',
        'promote_users', 'demote_users', 'manage_global_permissions',
    ],
    ADMIN: [
        'manage_users', 'manage_projects', 'manage_tickets', 'manage_meetings',
        'manage_knowledge', 'manage_settings', 'view_analytics', 'delete_anything',
        'manage_roles', 'export_data', 'create_users', 'disable_accounts',
    ],
    MANAGER: [
        'manage_projects', 'manage_tickets', 'manage_meetings', 'manage_knowledge',
        'view_analytics', 'assign_tickets', 'export_data',
        'create_tickets', 'move_tickets', 'comment_tickets',
    ],
    ENGINEER: [
        'create_tickets', 'update_own_tickets', 'comment_tickets', 'view_projects',
        'view_knowledge', 'create_articles', 'join_meetings',
    ],
    DESIGNER: [
        'create_tickets', 'update_own_tickets', 'comment_tickets', 'view_projects',
        'view_knowledge', 'create_articles', 'join_meetings',
    ],
    RESEARCHER: [
        'create_tickets', 'update_own_tickets', 'comment_tickets', 'view_projects',
        'view_knowledge', 'create_articles', 'manage_knowledge', 'join_meetings',
    ],
    VIEWER: ['view_projects', 'view_knowledge', 'view_tickets'],
}

export function hasPermission(role: Role, permission: string): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canManage(role: Role): boolean {
    return isRoleHigherOrEqual(role, 'MANAGER')
}

export function isAdminOrHigher(role: Role): boolean {
    return isRoleHigherOrEqual(role, 'ADMIN')
}

/** Archive / delete project / restore from archived — Admin or Super Admin only. */
export function isWorkspaceAdminRole(role: Role): boolean {
    return role === 'ADMIN' || role === 'SUPER_ADMIN'
}
