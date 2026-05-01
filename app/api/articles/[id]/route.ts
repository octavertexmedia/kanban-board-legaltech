import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-middleware'
import { isClientAuth, isWorkspaceAdminRole } from '@/lib/authorization'

const articleInclude = {
  author: { select: { id: true, name: true, avatar: true } },
} as const

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => t.trim().toLowerCase())
}

// GET /api/articles/[id] — internal only; increments view count once per request
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth
    if (isClientAuth(auth)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data: { views: { increment: 1 } },
      include: articleInclude,
    })

    return NextResponse.json({ article })
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : undefined
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH /api/articles/[id] — workspace admins only
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth
    if (isClientAuth(auth)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!isWorkspaceAdminRole(auth.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await req.json()

    const data: {
      title?: string
      content?: string
      category?: string
      tags?: string[]
    } = {}

    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim()
    if (typeof body.content === 'string' && body.content.trim()) data.content = body.content.trim()
    if (typeof body.category === 'string' && body.category.trim()) {
      data.category = body.category.trim()
    }
    if (body.tags !== undefined) data.tags = normalizeTags(body.tags)

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data,
      include: articleInclude,
    })

    return NextResponse.json({ article })
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : undefined
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE /api/articles/[id] — workspace admins only
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth(req)
    if (auth instanceof NextResponse) return auth
    if (isClientAuth(auth)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!isWorkspaceAdminRole(auth.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    await prisma.knowledgeArticle.delete({
      where: { id },
    })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : undefined
    if (code === 'P2025') {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
