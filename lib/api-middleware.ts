import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, type JWTPayload } from '@/lib/authorization'
import { Role } from '@prisma/client'
import prisma from '@/lib/db'
import { neonAuth } from '@/lib/neon/server'

export async function getAuthFromRequest(_req: NextRequest): Promise<JWTPayload | null> {
    const { data: session } = await neonAuth.getSession()
    const email = session?.user?.email?.toLowerCase()?.trim()
    if (!email) return null

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, userKind: true, status: true },
    })
    if (!user || user.status === 'INACTIVE') return null

    return {
        userId: user.id,
        email: user.email,
        role: user.role,
        userKind: user.userKind ?? 'INTERNAL',
    }
}

export async function requireAuth(req: NextRequest): Promise<JWTPayload | NextResponse> {
    const auth = await getAuthFromRequest(req)
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized — please log in' }, { status: 401 })
    }
    return auth
}

export async function requirePermission(
    req: NextRequest,
    permission: string,
): Promise<JWTPayload | NextResponse> {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth

    if (!hasPermission(auth.role as Role, permission)) {
        return NextResponse.json(
            { error: `Forbidden — you need "${permission}" permission` },
            { status: 403 },
        )
    }
    return auth
}

export async function requireRole(
    req: NextRequest,
    ...roles: Role[]
): Promise<JWTPayload | NextResponse> {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth

    if (!roles.includes(auth.role as Role)) {
        return NextResponse.json(
            { error: `Forbidden — requires role: ${roles.join(' or ')}` },
            { status: 403 },
        )
    }
    return auth
}
