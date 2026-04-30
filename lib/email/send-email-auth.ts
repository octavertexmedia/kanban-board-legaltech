import { NextRequest } from "next/server"
import { getAuthFromRequest } from "@/lib/api-middleware"

/** Header used by server-side jobs / notificationService when calling POST /api/send-email. */
export const EMAIL_WORKER_SECRET_HEADER = "x-email-worker-secret"

/**
 * Send-email is allowed for:
 * - Signed-in users (Neon Auth session cookies), or
 * - Requests bearing `INTERNAL_EMAIL_WORKER_SECRET` (required for server-side fetch
 *   from API routes, which do not forward the browser session cookie).
 */
export async function isSendEmailAuthorized(req: NextRequest): Promise<boolean> {
    const expected = process.env.INTERNAL_EMAIL_WORKER_SECRET?.trim()
    if (expected) {
        const provided = req.headers.get(EMAIL_WORKER_SECRET_HEADER)?.trim()
        if (provided === expected) return true
    }
    return (await getAuthFromRequest(req)) != null
}
