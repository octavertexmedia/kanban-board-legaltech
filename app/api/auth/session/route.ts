import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/api-middleware'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
    const auth = getAuthFromRequest(req)

    if (!auth) {
        return NextResponse.json({ user: null }, { status: 200 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
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

        return NextResponse.json({ user })
    } catch {
        return NextResponse.json({ user: null })
    }
}
