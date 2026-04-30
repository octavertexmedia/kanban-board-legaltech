import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { neonAuth } from '@/lib/neon/server'

const neonProtect = neonAuth.middleware({ loginUrl: '/auth/sign-in' })

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }

    // Neon’s built-in skip list does not include this legacy path; allow through so the server redirect runs.
    if (pathname === '/auth/verify-email') {
        return NextResponse.next()
    }

    // Public legal pages (linked from auth and footers).
    if (pathname.startsWith('/legal')) {
        return NextResponse.next()
    }

    return neonProtect(request)
}

export const config = {
    // Keep API routes out of middleware so unauthenticated JSON requests get 401, not HTML redirects.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
