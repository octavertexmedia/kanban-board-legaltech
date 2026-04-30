'use strict'

/**
 * Loads env files in the same order as typical local dev, then maps Vercel / Neon
 * integration variable names to what Prisma expects (DATABASE_URL, DIRECT_DATABASE_URL).
 *
 * Does NOT configure Neon Auth (NEON_AUTH_* / Stack) — that is separate from the DB URL.
 */
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

function loadDatabaseEnv(root = path.resolve(__dirname, '..')) {
  dotenv.config({ path: path.join(root, '.env') })
  dotenv.config({ path: path.join(root, '.env.local'), override: true })

  const vercelDev = path.join(root, '.vercel', '.env.development.local')
  if (fs.existsSync(vercelDev)) {
    dotenv.config({ path: vercelDev, override: true })
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      process.env.kanban_POSTGRES_PRISMA_URL ||
      process.env.kanban_POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      ''
  }

  if (!process.env.DIRECT_DATABASE_URL) {
    process.env.DIRECT_DATABASE_URL =
      process.env.kanban_POSTGRES_URL_NON_POOLING ||
      process.env.kanban_DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL ||
      ''
  }
}

module.exports = { loadDatabaseEnv }
