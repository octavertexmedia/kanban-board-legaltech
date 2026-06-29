# Deployment checklist

## Environment variables (Vercel)

Set these in the Vercel project — **never commit real values to git**.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon pooled Postgres connection string |
| `DIRECT_DATABASE_URL` | Neon direct (non-pooler) URL for migrations |
| `NEON_AUTH_BASE_URL` | Neon Auth project URL |
| `NEON_AUTH_COOKIE_SECRET` | Cookie signing secret (32+ chars) |
| `vertexpm_DATABASE_URL` | Optional Neon integration alias → mapped to `DATABASE_URL` |
| `vertexpm_DIRECT_DATABASE_URL` | Optional alias → `DIRECT_DATABASE_URL` |
| `vertexpm_VITE_NEON_AUTH_URL` | Optional alias → `NEON_AUTH_BASE_URL` |
| `INTERNAL_EMAIL_WORKER_SECRET` | Server-only secret for `/api/send-email` |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender address |
| `NEXT_PUBLIC_APP_URL` | Production URL e.g. `https://kanban.vertexcrm.in` |
| `ALLOW_PUBLIC_SIGNUP` | Set to `true` only if open registration is intended |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (optional uploads) |
| `GOOGLE_*` | Google Calendar / Meet (optional) |
| `PUSHER_*` | Realtime (optional) |

## Build

The `build` script runs `prisma migrate deploy`, `prisma generate`, and `next build`.

**Your existing data is preserved on deploy.** Migrations only apply schema changes (new tables/columns/indexes). They do not delete users, projects, tickets, or other rows.

The sprint migration (`20260501130000_sprints`) is additive only:

- Creates the `Sprint` table
- Adds optional nullable `Ticket.sprintId` (existing tickets keep `NULL`)

## Data preservation (important)

| Command | Runs on Vercel build? | Effect on data |
|---------|----------------------|----------------|
| `prisma migrate deploy` | **Yes** | Safe — schema only, no row deletes |
| `prisma db seed` | **No** | **Wipes all data** then inserts demo data |
| `pnpm db:reset` | **No** | **Drops and recreates** schema + seed |

**Do not run `pnpm db:seed` or `pnpm db:reset` against production.**

The seed script refuses to run when `NODE_ENV=production` unless you explicitly set `ALLOW_SEED=true` (still destructive).

## Post-deploy

1. Confirm migrations applied in build logs.
2. Bootstrap admins via Neon Auth + workspace admin list.
3. Run `pnpm db:seed` only on **local/dev** if you need demo data — never on production.

## Security

- Rotate any credentials that were ever committed to git.
- Keep `ALLOW_PUBLIC_SIGNUP` unset or `false` for invite-only workspaces.
- Use `INTERNAL_EMAIL_WORKER_SECRET` for all outbound email from API routes.
