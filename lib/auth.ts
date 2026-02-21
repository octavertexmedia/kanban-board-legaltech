import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'cengineers-kanban-secret-key-2026'
const JWT_EXPIRES_IN = '7d'

export interface AuthUser {
    id: string
    name: string
    email: string
    role: Role
}

export interface JWTPayload {
    userId: string
    email: string
    role: Role
    iat?: number
    exp?: number
}

// ─── Hash a password ─────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

// ─── Verify a password ───────────────────────────────────
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

// ─── Generate JWT token ──────────────────────────────────
export function generateToken(user: AuthUser): string {
    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// ─── Verify JWT token ────────────────────────────────────
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch {
        return null
    }
}

// ─── Role Hierarchy ──────────────────────────────────────
// Higher index = higher authority
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

// ─── Role permissions map ────────────────────────────────
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
    VIEWER: [
        'view_projects', 'view_knowledge', 'view_tickets',
    ],
}

// ─── Check permission ────────────────────────────────────
export function hasPermission(role: Role, permission: string): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// ─── Check if user can manage a resource ─────────────────
export function canManage(role: Role): boolean {
    return isRoleHigherOrEqual(role, 'MANAGER')
}

// ─── Check if user is admin or higher ────────────────────
export function isAdminOrHigher(role: Role): boolean {
    return isRoleHigherOrEqual(role, 'ADMIN')
}
