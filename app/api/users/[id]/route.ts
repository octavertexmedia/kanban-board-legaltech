import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'
import { isClientAuth } from '@/lib/auth'

// GET /api/users/[id] — Fetch specific user details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const auth = getAuthFromRequest(req)

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                userKind: true,
                status: true,
                avatar: true,
                createdAt: true,
                lastActive: true,
                assignedTickets: {
                    select: {
                        id: true,
                        title: true,
                        priority: true,
                        type: true,
                        column: { select: { title: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                activityLogs: {
                    select: { id: true, action: true, entity: true, details: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (isClientAuth(auth) && id !== auth.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({ user })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH /api/users/[id] — Update user role/status/profile
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const auth = getAuthFromRequest(req)

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (isClientAuth(auth)) {
            if (auth.userId !== id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        const body = await req.json()
        const { status, role, name, avatar } = body

        const target = await prisma.user.findUnique({ where: { id }, select: { role: true, name: true } })
        if (!target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Role/Status changes require Admin access
        if (status || role) {
            if (isClientAuth(auth)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
            if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
                return NextResponse.json({ error: 'Forbidden — Admin access required to change role/status' }, { status: 403 })
            }

            // Cannot modify SUPER_ADMIN unless you ARE SUPER_ADMIN
            if (target.role === 'SUPER_ADMIN' && auth.role !== 'SUPER_ADMIN') {
                return NextResponse.json({ error: 'Forbidden — cannot modify Super Admin' }, { status: 403 })
            }

            // ADMIN cannot modify peer ADMINs
            if (target.role === 'ADMIN' && auth.role === 'ADMIN' && auth.userId !== id) {
                return NextResponse.json({ error: 'Forbidden — cannot modify peer Admin accounts' }, { status: 403 })
            }

            // Cannot self-deactivate
            if (status && auth.userId === id && status !== 'ACTIVE') {
                return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
            }
        }

        // Profile changes (name/avatar) require being the user OR being an admin
        if (name || avatar) {
            if (auth.role !== 'ADMIN' && auth.role !== 'SUPER_ADMIN' && auth.userId !== id) {
                return NextResponse.json({ error: 'Forbidden — you can only update your own profile' }, { status: 403 })
            }
        }

        const updateData: any = {}
        if (status) updateData.status = status
        if (name) updateData.name = name
        if (avatar !== undefined) updateData.avatar = avatar // Allow null to remove avatar

        if (role) {
            // Only SUPER_ADMIN can promote to ADMIN
            if (role === 'ADMIN' && auth.role !== 'SUPER_ADMIN') {
                return NextResponse.json({ error: 'Forbidden — only Super Admin can promote to Admin' }, { status: 403 })
            }
            if (role === 'SUPER_ADMIN') {
                return NextResponse.json({ error: 'Forbidden — cannot promote to Super Admin' }, { status: 403 })
            }
            updateData.role = role
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                userKind: true,
                status: true,
                avatar: true,
            },
        })

        await prisma.activityLog.create({
            data: {
                action: 'updated',
                entity: 'user',
                entityId: id,
                details: `Updated user "${target.name}"`,
                userId: auth.userId,
            },
        })

        return NextResponse.json({ user: updated })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/users/[id] — Only SUPER_ADMIN can delete users
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const auth = getAuthFromRequest(req)

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (auth.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden — only Super Admin can delete users' }, { status: 403 })
        }

        if (auth.userId === id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
        }

        const target = await prisma.user.findUnique({ where: { id }, select: { name: true, role: true } })
        if (!target) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (target.role === 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Cannot delete Super Admin accounts' }, { status: 403 })
        }

        await prisma.user.delete({ where: { id } })

        await prisma.activityLog.create({
            data: {
                action: 'deleted',
                entity: 'user',
                entityId: id,
                details: `Deleted user "${target.name}"`,
                userId: auth.userId,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
