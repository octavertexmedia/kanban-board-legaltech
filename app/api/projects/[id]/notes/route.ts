import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { canAccessProject } from '@/lib/project-access'
import { isClientAuth } from '@/lib/authorization'

/** GET /api/projects/[id]/notes — Internal project discussion notes (not for client portal). */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id: projectId } = await params
        const ok = await canAccessProject(prisma, auth, projectId)
        if (!ok) {
            return NextResponse.json({ error: 'Forbidden or project not found' }, { status: 403 })
        }

        const notes = await prisma.projectNote.findMany({
            where: { projectId },
            include: {
                author: { select: { id: true, name: true, email: true, avatar: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        })

        return NextResponse.json({ notes })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

/** POST /api/projects/[id]/notes */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id: projectId } = await params
        const ok = await canAccessProject(prisma, auth, projectId)
        if (!ok) {
            return NextResponse.json({ error: 'Forbidden or project not found' }, { status: 403 })
        }

        const body = await req.json()
        const text = typeof body.body === 'string' ? body.body.trim() : ''
        if (!text) {
            return NextResponse.json({ error: 'body is required' }, { status: 400 })
        }
        if (text.length > 8000) {
            return NextResponse.json({ error: 'Note is too long (max 8000 chars)' }, { status: 400 })
        }

        const note = await prisma.projectNote.create({
            data: {
                projectId,
                authorId: auth.userId,
                body: text,
            },
            include: {
                author: { select: { id: true, name: true, email: true, avatar: true } },
            },
        })

        return NextResponse.json({ note }, { status: 201 })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
