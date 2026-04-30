'use strict'

/**
 * Runs the Prisma CLI after loading `.env` then `.env.local` (later overrides).
 * Matches how many devs split secrets (Next.js reads both; Prisma CLI only reads `.env` by default).
 */
const path = require('path')
const { spawnSync } = require('child_process')
const { loadDatabaseEnv } = require('./load-database-env.cjs')

const root = path.resolve(__dirname, '..')
loadDatabaseEnv(root)

const prismaCli = path.join(root, 'node_modules', 'prisma', 'build', 'index.js')
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/prisma-with-env.cjs <prisma command...>')
  console.error('Example: node scripts/prisma-with-env.cjs migrate deploy')
  process.exit(1)
}

const r = spawnSync(process.execPath, [prismaCli, ...args], {
  stdio: 'inherit',
  cwd: root,
  env: process.env,
})

process.exit(r.status === 0 ? 0 : r.status ?? 1)
