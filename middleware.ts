import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { readJwtPayloadUnsafe, jwtExpIsValid } from '@/lib/jwt-payload-edge'

const CLIENT_HOME = '/client'

function isClientUserKind(payload: Record<string, unknown> | null): boolean {
    return payload?.userKind === 'CLIENT'
}

/** Paths client users may access (prefix match for nested routes). */
const CLIENT_ALLOWED_PREFIXES = [
    '/client',
    '/projects',
    '/profile',
    '/notifications',
    '/login',
]

function clientMayAccessPath(pathname: string): boolean {
    if (pathname === '/login') return true
    return CLIENT_ALLOWED_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value
    const pathname = request.nextUrl.pathname

    // Public paths that do not require authentication
    const isPublicPath = pathname === '/login' ||
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname === '/favicon.ico'

    if (!token && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = token ? readJwtPayloadUnsafe(token) : null
    const tokenUsable = Boolean(payload && jwtExpIsValid(payload))

    if (token && !tokenUsable && !isPublicPath) {
        const res = NextResponse.redirect(new URL('/login', request.url))
        res.cookies.set('auth-token', '', { path: '/', maxAge: 0 })
        return res
    }

    if (token && pathname === '/login') {
        if (!tokenUsable) {
            return NextResponse.next()
        }
        const dest = isClientUserKind(payload) ? CLIENT_HOME : '/'
        return NextResponse.redirect(new URL(dest, request.url))
    }

    if (token && tokenUsable && isClientUserKind(payload) && !isPublicPath) {
        if (!clientMayAccessPath(pathname)) {
            return NextResponse.redirect(new URL(CLIENT_HOME, request.url))
        }
    }

    if (token && tokenUsable && !isClientUserKind(payload) && pathname.startsWith('/client')) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
