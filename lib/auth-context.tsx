'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createAuthClient } from '@neondatabase/auth/next'

const authClient = createAuthClient()

interface User {
    id: string
    name: string
    email: string
    role: string
    userKind?: string
    avatar: string | null
    status: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    isAuthenticated: boolean
    isClientUser: boolean
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>
    logout: () => Promise<void>
    hasPermission: (permission: string) => boolean
    isManager: boolean
    isAdmin: boolean
    isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ROLE_PERMISSIONS: Record<string, string[]> = {
    SUPER_ADMIN: [
        'manage_users', 'manage_projects', 'manage_tickets', 'manage_meetings',
        'manage_knowledge', 'manage_settings', 'view_analytics', 'delete_anything',
        'manage_roles', 'export_data', 'create_admins', 'manage_system',
        'promote_users', 'demote_users', 'manage_global_permissions',
        'create_users', 'disable_accounts',
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    const refreshSession = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/session', { credentials: 'include' })
            const data = await res.json()
            if (data.user) setUser(data.user)
            else setUser(null)
        } catch {
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void refreshSession()
    }, [refreshSession])

    const login = useCallback(async (email: string, password: string) => {
        try {
            const { error } = await authClient.signIn.email({ email, password })
            if (error) {
                return { success: false, error: error.message || 'Login failed' }
            }
            await refreshSession()
            const res = await fetch('/api/auth/session', { credentials: 'include' })
            const data = await res.json()
            return { success: true, user: data.user as User | undefined }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Login failed'
            return { success: false, error: message }
        }
    }, [refreshSession])

    const logout = useCallback(async () => {
        try {
            await authClient.signOut()
        } catch {
            await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' })
        }
        setUser(null)
        router.push('/auth/sign-in')
    }, [router])

    const hasPermission = useCallback(
        (permission: string) => {
            if (!user) return false
            return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
        },
        [user],
    )

    const value: AuthContextType = {
        user,
        token: null,
        isLoading,
        isAuthenticated: !!user,
        isClientUser: user?.userKind === 'CLIENT',
        login,
        logout,
        hasPermission,
        isManager: user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER',
        isAdmin: user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN',
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
