import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'

// Next.js does not load `.vercel/.env.development.local`; align with Prisma CLI + Vercel `vercel pull`.
if (!process.env.DATABASE_URL || !process.env.DIRECT_DATABASE_URL) {
    const require = createRequire(import.meta.url)
    require('../scripts/load-database-env.cjs').loadDatabaseEnv()
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
