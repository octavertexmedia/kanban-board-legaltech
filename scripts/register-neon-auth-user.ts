/**
 * Calls Neon Auth `sign-up/email` over HTTP (no Next request context), then upserts Prisma `User`.
 * Sends `Origin: https://kanban.vertexcrm.in` (override with NEON_BOOTSTRAP_ORIGIN) so Neon allowlists match production.
 *
 *   pnpm neon-auth:bootstrap-user
 *
 * Env: same as the app (`vertexpm_NEON_AUTH_BASE_URL` or `NEON_AUTH_BASE_URL`, `DATABASE_URL` / `vertexpm_*`).
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('./load-database-env.cjs').loadDatabaseEnv()

const PROXY_HEADER = 'x-neon-auth-proxy'

function authBaseUrl(): string {
    return (
        process.env.vertexpm_NEON_AUTH_BASE_URL?.trim() ||
        process.env.NEON_AUTH_BASE_URL?.trim() ||
        ''
    )
}

async function main() {
    const email = (
        process.env.NEON_BOOTSTRAP_EMAIL || 'octavertexmedia@gmail.com'
    )
        .toLowerCase()
        .trim()
    const password = process.env.NEON_BOOTSTRAP_PASSWORD || 'Admin@2026'
    const name = process.env.NEON_BOOTSTRAP_NAME || 'OctaVertex Media'
    const origin = (
        process.env.NEON_BOOTSTRAP_ORIGIN ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://kanban.vertexcrm.in'
    )
        .trim()
        .replace(/\/$/, '')

    const base = authBaseUrl()
    if (!base) {
        console.error('Missing vertexpm_NEON_AUTH_BASE_URL or NEON_AUTH_BASE_URL')
        process.exit(1)
    }

    const url = new URL('sign-up/email', base.endsWith('/') ? base : `${base}/`)
    const body = {
        email,
        password,
        name,
        callbackURL: origin,
    }

    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Origin: origin,
            [PROXY_HEADER]: 'nextjs',
        },
        body: JSON.stringify(body),
    })

    const text = await res.text()
    let json: { message?: string } | null = null
    try {
        json = JSON.parse(text) as { message?: string }
    } catch {
        /* ignore */
    }

    if (!res.ok) {
        const msg = json?.message || text || res.statusText
        const exists =
            res.status === 409 ||
            /already|exist|registered|duplicate/i.test(String(msg))
        if (!exists) {
            console.error('Neon Auth sign-up failed:', res.status, msg)
            process.exit(1)
        }
        console.log('Neon Auth: user may already exist —', msg)
    } else {
        console.log('Neon Auth: sign-up OK for', email)
    }

    const { default: prisma } = await import('../lib/db')
    const { hashPassword } = await import('../lib/authorization')
    const { Role, UserKind } = await import('@prisma/client')

    const hashed = await hashPassword(password)
    await prisma.user.upsert({
        where: { email },
        create: {
            email,
            name,
            password: hashed,
            role: Role.ADMIN,
            userKind: UserKind.INTERNAL,
            status: 'ACTIVE',
        },
        update: {
            name,
            password: hashed,
            role: Role.ADMIN,
            userKind: UserKind.INTERNAL,
            status: 'ACTIVE',
        },
    })
    console.log('Prisma User upserted as ADMIN:', email)
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
