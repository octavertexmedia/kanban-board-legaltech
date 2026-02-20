import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value

    // Public paths that do not require authentication
    const isPublicPath = request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname.startsWith('/api/') ||
        request.nextUrl.pathname.startsWith('/_next/') ||
        request.nextUrl.pathname === '/favicon.ico'

    if (!token && !isPublicPath) {
        // If not logged in and requesting a protected route, redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (token && request.nextUrl.pathname === '/login') {
        // If logged in and requesting login page, redirect to dashboard
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
