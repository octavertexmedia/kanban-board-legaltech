import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { neonAuth } from '@/lib/neon/server'

const neonProtect = neonAuth.middleware({ loginUrl: '/auth/sign-in' })

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }

    return neonProtect(request)
}

export const config = {
    // Keep API routes out of middleware so unauthenticated JSON requests get 401, not HTML redirects.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
