# OctaVertex Media PM + client portal — implementation contracts

This document locks interfaces so parallel workstreams stay consistent.

## Enums (Prisma)

- **`UserKind`**: `INTERNAL` | `CLIENT` — on `User.userKind`, default `INTERNAL`.
- **`ProjectMemberRole`**: `OWNER` | `MEMBER` | `CLIENT` — on `ProjectMember.role` (replaces free-form string; migrate `owner`→`OWNER`, `member`→`MEMBER`).
- **`StatusUpdateVisibility`**: `INTERNAL` | `CLIENT` — on `ProjectStatusUpdate.visibility`. Clients only query rows where `visibility === CLIENT`. Internal users see both unless filtered in UI.

## `ProjectStatusUpdate`

- `id`, `projectId`, `authorId`, `title`, `body` (string), `visibility`, `createdAt`, `updatedAt`.
- Relations: `project`, `author` (User).

## JWT (`JWTPayload` in `lib/auth.ts`)

- `userId`, `email`, `role` (existing `Role` enum — for clients use `Role.VIEWER` or lowest internal role; **must** use `userKind: UserKind` to gate UI and middleware).
- Tokens issued **without** `userKind` (legacy) MUST be treated as `INTERNAL` in `verifyToken` consumers.

## `lib/project-access.ts` — public API

```ts
// Returns project IDs the principal may access for list/detail queries.
export async function getAccessibleProjectIds(
  prisma: PrismaClient,
  payload: JWTPayload
): Promise<string[]>

// True if payload may access this project (membership or admin bypass).
export async function canAccessProject(
  prisma: PrismaClient,
  payload: JWTPayload,
  projectId: string
): Promise<boolean>

// Admin / super-admin bypass all project membership checks.
export function hasGlobalProjectAccess(payload: JWTPayload): boolean
```

**Rules**

1. **`hasGlobalProjectAccess`**: `role` is `SUPER_ADMIN` or `ADMIN`.
2. **Else if `userKind === CLIENT`**: projects where user is `ProjectMember` with `role === CLIENT`.
3. **Else (internal)**: projects where user is `ProjectMember` with any `ProjectMemberRole`.

## Client-forbidden routes (middleware)

Path prefix blocks for `userKind === CLIENT` (redirect to `/client` or return 403 for non-API):

- `/users`, `/settings`, `/meetings`, `/knowledge`, `/audit-log`, `/notifications` (optional: allow read-only notifications — **default block**), `/docs`, `/subjects`, `/profile` (allow **only** `/profile` if it is account-only — **plan: allow `/profile`**, block admin settings).
- Allow: `/`, `/client`, `/client/*`, `/projects/*` (read-only client UX still uses `/projects/:id` with API enforcing scope), `/login`, `/api/*` (API returns 403 where applicable).

**Refined**: Clients use dedicated `/client` and `/client/projects/[id]` pages; middleware sends CLIENT users away from internal-only paths.

## API routes checklist (enforce `getAccessibleProjectIds` / `canAccessProject`)

- `app/api/projects/route.ts` — GET list, POST create (internal only for POST).
- `app/api/projects/[id]/route.ts` — GET/PATCH/DELETE.
- `app/api/tickets/route.ts` — list/create.
- `app/api/tickets/[id]/route.ts` — get/update/delete.
- `app/api/tickets/[id]/comments/route.ts` — GET/POST (clients: GET only if plan says no comments — **default: clients GET comments, POST forbidden**).
- `app/api/tickets/reassign/route.ts`.
- `app/api/dashboard/stats/route.ts`.
- `app/api/search/route.ts`.
- `app/api/upload/route.ts` — forbid clients or tie to ticket project access.
- `app/api/audit-logs/route.ts` — internal only.
- `app/api/articles/route.ts` — internal only for clients.
- `app/api/meetings/route.ts` — internal only.
- `app/api/notifications/route.ts` — scope to user; clients OK.
- `app/api/projects/[id]/status-updates/route.ts` — **new** GET (filtered by visibility) + POST (internal only, optional CLIENT visibility in body).

## New routes

- `GET/POST /api/projects/[projectId]/status-updates` — projectId in path; POST body: `{ title, body, visibility }`.

## Files that consume JWT on client

- `lib/auth-context.tsx` — expose `userKind`.
- `app/api/auth/session/route.ts` — return `userKind`.
