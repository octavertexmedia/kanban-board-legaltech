import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { isClientAuth, isWorkspaceAdminRole } from '@/lib/authorization'

// GET /api/articles
export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search')
        const category = searchParams.get('category')
        const limitRaw = searchParams.get('limit')
        const take =
            limitRaw != null && limitRaw !== ''
                ? Math.min(50, Math.max(1, parseInt(limitRaw, 10) || 10))
                : undefined

        const where: any = {}
        if (category) where.category = category
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { tags: { hasSome: [search.toLowerCase()] } },
            ]
        }

        const articles = await prisma.knowledgeArticle.findMany({
            where,
            include: {
                author: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { updatedAt: 'desc' },
            ...(take != null ? { take } : {}),
        })

        return NextResponse.json({ articles })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/articles
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req)
        if (auth instanceof NextResponse) return auth
        if (isClientAuth(auth)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        if (!isWorkspaceAdminRole(auth.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()

        if (!body.title || !body.content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
        }

        const tags = Array.isArray(body.tags)
            ? body.tags
                  .filter((t: unknown) => typeof t === 'string' && t.trim())
                  .map((t: string) => t.trim().toLowerCase())
            : []

        const article = await prisma.knowledgeArticle.create({
            data: {
                title: body.title,
                content: body.content,
                category: body.category || 'General',
                tags,
                authorId: auth.userId,
            },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
            },
        })

        return NextResponse.json({ article }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
