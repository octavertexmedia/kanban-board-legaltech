import { createNeonAuth } from '@neondatabase/auth/next/server'

/** Vercel Neon Storage uses `vertexpm_*`; middleware runs on Edge (no load-database-env). */
function neonAuthBaseUrl(): string {
    return (
        process.env.vertexpm_NEON_AUTH_BASE_URL?.trim() ||
        process.env.NEON_AUTH_BASE_URL?.trim() ||
        'https://invalid.neon.auth.not-configured.local'
    )
}

function cookieSecret(): string {
    const s = process.env.NEON_AUTH_COOKIE_SECRET?.trim()
    if (s && s.length >= 32) return s
    if (process.env.NODE_ENV === 'production') {
        throw new Error('NEON_AUTH_COOKIE_SECRET must be set to a string at least 32 characters long')
    }
    // Dev-only fallback so local `next dev` can start without Neon env; replace in .env.local.
    return 'dev-only-neon-auth-cookie-secret-min-32-chars!!'
}

export const neonAuth = createNeonAuth({
    baseUrl: neonAuthBaseUrl(),
    cookies: {
        secret: cookieSecret(),
    },
})
