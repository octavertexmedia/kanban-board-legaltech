'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
    id: string
    name: string
    email: string
    role: string
    avatar: string | null
    status: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
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
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Check session on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('auth-token')
        if (savedToken) {
            setToken(savedToken)
            checkSession(savedToken)
        } else {
            setIsLoading(false)
        }
    }, [])

    const checkSession = async (authToken: string) => {
        try {
            const res = await fetch('/api/auth/session', {
                headers: { Authorization: `Bearer ${authToken}` },
            })
            const data = await res.json()
            if (data.user) {
                setUser(data.user)
            } else {
                localStorage.removeItem('auth-token')
                setToken(null)
            }
        } catch {
            localStorage.removeItem('auth-token')
            setToken(null)
        } finally {
            setIsLoading(false)
        }
    }

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()

            if (!res.ok) {
                return { success: false, error: data.error || 'Login failed' }
            }

            setUser(data.user)
            setToken(data.token)
            localStorage.setItem('auth-token', data.token)
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    }, [])

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
        } catch { }
        setUser(null)
        setToken(null)
        localStorage.removeItem('auth-token')
        router.push('/login')
    }, [router])

    const hasPermission = useCallback((permission: string) => {
        if (!user) return false
        return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
    }, [user])

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
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
