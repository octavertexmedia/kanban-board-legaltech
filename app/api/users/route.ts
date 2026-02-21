import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest, requireRole } from '@/lib/api-middleware'
import { hashPassword } from '@/lib/auth'

// GET /api/users — List users (requires authentication)
export async function GET(req: NextRequest) {
    try {
        const auth = getAuthFromRequest(req)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        const auth = requireRole(req, 'SUPER_ADMIN' as any, 'ADMIN' as any)
        if (auth instanceof NextResponse) return auth

        const body = await req.json()
        const { name, email, password, role } = body

        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { error: 'Name, email, password, and role are required' },
                { status: 400 }
            )
        }

        // Validate role assignment hierarchy
        const requestedRole = role.toUpperCase()
        const validRoles = ['MANAGER', 'ENGINEER', 'DESIGNER', 'RESEARCHER', 'VIEWER']

        // Only SUPER_ADMIN can create ADMIN accounts
        if (requestedRole === 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Forbidden — only Super Admin can create Admin accounts' },
                { status: 403 }
            )
        }

        // Cannot create SUPER_ADMIN accounts via API
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

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
        if (existing) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            )
        }

        const hashedPassword = await hashPassword(password)

        const newUser = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: requestedRole as any,
                status: 'ACTIVE',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                avatar: true,
                createdAt: true,
            },
        })

        // Log activity
        await prisma.activityLog.create({
            data: {
                action: 'created',
                entity: 'user',
                entityId: newUser.id,
                details: `Created user "${name}" with role ${requestedRole}`,
                userId: auth.userId,
            },
        })

        return NextResponse.json({ user: newUser }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
