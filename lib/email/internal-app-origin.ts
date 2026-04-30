/** Base URL for server-to-server calls to this app (e.g. POST /api/send-email). */
export function getInternalAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")
  if (explicit) return explicit
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
  const port = process.env.PORT || "3000"
  return `http://127.0.0.1:${port}`
}
