import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'

// Next.js does not load `.vercel/.env.development.local`; align with Prisma CLI + Vercel `vercel pull`.
// Always run: maps `vertexpm_*` Neon integration vars even when DATABASE_URL is already set.
const require = createRequire(import.meta.url)
require('../scripts/load-database-env.cjs').loadDatabaseEnv()

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
