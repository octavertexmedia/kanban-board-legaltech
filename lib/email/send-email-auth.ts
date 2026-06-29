import { NextRequest } from "next/server"
import { getAuthFromRequest } from "@/lib/api-middleware"

/** Header used by server-side jobs / notificationService when calling POST /api/send-email. */
export const EMAIL_WORKER_SECRET_HEADER = "x-email-worker-secret"

/**
 * Send-email is allowed only for requests bearing `INTERNAL_EMAIL_WORKER_SECRET`.
 * Browser sessions cannot trigger outbound email directly.
 */
export async function isSendEmailAuthorized(req: NextRequest): Promise<boolean> {
    const expected = process.env.INTERNAL_EMAIL_WORKER_SECRET?.trim()
    if (!expected) return false
    const provided = req.headers.get(EMAIL_WORKER_SECRET_HEADER)?.trim()
    return provided === expected
}
