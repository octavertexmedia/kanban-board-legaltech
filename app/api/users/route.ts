import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest, requireRole } from '@/lib/api-middleware'
import { hashPassword, isClientAuth, isRoleHigherOrEqual } from '@/lib/authorization'
import { neonAuth } from '@/lib/neon/server'
import { UserKind } from '@prisma/client'

// GET /api/users — List users (requires authentication)
export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        if (!isRoleHigherOrEqual(auth.role, 'MANAGER')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search')
        const role = searchParams.get('role')

        const where: any = {}
        if (role) where.role = role.toUpperCase()
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ]
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                userKind: true,
                status: true,
                avatar: true,
                lastActive: true,
                createdAt: true,
                _count: {
                    select: {
                        assignedTickets: true,
                        projectMemberships: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        })

        return NextResponse.json({ users })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/users — Admin creates a new user (RBAC enforced)
export async function POST(req: NextRequest) {
    try {
        // Only SUPER_ADMIN and ADMIN can create users
        const auth = await requireRole(req, 'SUPER_ADMIN' as any, 'ADMIN' as any)
        if (auth instanceof NextResponse) return auth

        const body = await req.json()
        const { name, email, password, role, userKind: bodyUserKind } = body

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        const userKind =
            String(bodyUserKind).toUpperCase() === 'CLIENT'
                ? UserKind.CLIENT
                : UserKind.INTERNAL

        if (userKind === UserKind.INTERNAL && !role) {
            return NextResponse.json(
                { error: 'Role is required for internal users' },
                { status: 400 }
            )
        }

        const requestedRole = (role || 'VIEWER').toString().toUpperCase()
        const validRoles = ['MANAGER', 'ENGINEER', 'DESIGNER', 'RESEARCHER', 'VIEWER']

        if (userKind === UserKind.INTERNAL) {
            if (requestedRole === 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
                return NextResponse.json(
                    { error: 'Forbidden — only Super Admin can create Admin accounts' },
                    { status: 403 }
                )
            }

            if (requestedRole === 'SUPER_ADMIN') {
                return NextResponse.json(
                    { error: 'Forbidden — cannot create Super Admin accounts' },
                    { status: 403 }
                )
            }

            if (!validRoles.includes(requestedRole) && requestedRole !== 'ADMIN') {
                return NextResponse.json(
                    { error: `Invalid role. Valid roles: ${validRoles.join(', ')}` },
                    { status: 400 }
                )
            }
        }

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
        if (existing) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            )
        }

        const hashedPassword = await hashPassword(password)

        const effectiveRole =
            userKind === UserKind.CLIENT ? 'VIEWER' : requestedRole

        const newUser = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: effectiveRole as any,
                userKind,
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
                createdAt: true,
            },
        })

        const neonUp = await neonAuth.signUp.email({
            email: email.toLowerCase(),
            password,
            name,
        })
        if (neonUp.error) {
            await prisma.user.delete({ where: { id: newUser.id } }).catch(() => {})
            return NextResponse.json(
                {
                    error:
                        neonUp.error.message ||
                        'Could not register Neon Auth sign-in for this user (email may already exist in Neon Auth).',
                },
                { status: 400 },
            )
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'created',
                entity: 'user',
                entityId: newUser.id,
                details: `Created user "${name}" (${userKind}) role ${effectiveRole}`,
                userId: auth.userId,
            },
        })

        return NextResponse.json({ user: newUser }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
