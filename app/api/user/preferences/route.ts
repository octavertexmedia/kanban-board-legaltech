import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'
import { mergeUserPreferences } from '@/lib/user-preferences'

// GET /api/user/preferences — Load notification preferences
export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthFromRequest(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { preferences: true },
        })

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const prefs = user.preferences ? JSON.parse(user.preferences as string) : {}
        return NextResponse.json(prefs)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT /api/user/preferences — Merge partial preferences (notifications, appearance, profile, etc.)
export async function PUT(req: NextRequest) {
    try {
        const auth = await getAuthFromRequest(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = (await req.json()) as Record<string, unknown>

        const row = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { preferences: true },
        })
        if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const merged = mergeUserPreferences(row.preferences as string | null, body)

        await prisma.user.update({
            where: { id: auth.userId },
            data: { preferences: JSON.stringify(merged) },
        })

        return NextResponse.json(merged)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
