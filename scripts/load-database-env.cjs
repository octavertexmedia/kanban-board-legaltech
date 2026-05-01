'use strict'

/**
 * Loads env files (.env → .env.local → .vercel/.env.development.local), then maps
 * Vercel Neon integration vars prefixed with `vertexpm_` into what the app expects:
 * - DATABASE_URL, DIRECT_DATABASE_URL (Prisma / @neondatabase/serverless)
 * - NEON_AUTH_BASE_URL (Neon Auth server SDK)
 *
 * Canonical names set explicitly in env always win. Only use `vertexpm_*` when
 * those are unset (typical Vercel + Neon Storage integration).
 */
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

function v(name) {
  const s = process.env[name]
  return typeof s === 'string' ? s.trim() : ''
}

function hasVertexPmDbUrl() {
  return !!(
    v('vertexpm_POSTGRES_PRISMA_URL') ||
    v('vertexpm_POSTGRES_URL') ||
    v('vertexpm_DATABASE_URL')
  )
}

function applyVertexPmAliases() {
  // When Vercel Neon integration sets `vertexpm_*`, prefer it over legacy DATABASE_URL in pulled env.
  if (hasVertexPmDbUrl()) {
    process.env.DATABASE_URL =
      v('vertexpm_POSTGRES_PRISMA_URL') ||
      v('vertexpm_POSTGRES_URL') ||
      v('vertexpm_DATABASE_URL') ||
      ''
    process.env.DIRECT_DATABASE_URL =
      v('vertexpm_POSTGRES_URL_NON_POOLING') ||
      v('vertexpm_DATABASE_URL_UNPOOLED') ||
      v('vertexpm_POSTGRES_URL') ||
      v('vertexpm_DATABASE_URL') ||
      process.env.DATABASE_URL ||
      ''
  } else {
    if (!process.env.DIRECT_DATABASE_URL && process.env.DATABASE_URL) {
      process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL
    }
  }

  if (v('vertexpm_NEON_AUTH_BASE_URL')) {
    process.env.NEON_AUTH_BASE_URL = v('vertexpm_NEON_AUTH_BASE_URL')
  }
}

function loadDatabaseEnv(root = path.resolve(__dirname, '..')) {
  dotenv.config({ path: path.join(root, '.env') })
  dotenv.config({ path: path.join(root, '.env.local'), override: true })

  const vercelDev = path.join(root, '.vercel', '.env.development.local')
  if (fs.existsSync(vercelDev)) {
    dotenv.config({ path: vercelDev, override: true })
  }

  applyVertexPmAliases()
}

module.exports = { loadDatabaseEnv, applyVertexPmAliases }
