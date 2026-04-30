import { APP_DISPLAY_NAME } from "@/lib/brand"

/** Public app URL (links in emails). Defaults to production CRM host. */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://kanban.vertexcrm.in"

/**
 * Verified sender address in Resend (e.g. notifications@yourdomain.com).
 * Alternatively set RESEND_FROM to a full RFC string: `Vertex PM <notifications@...>`.
 */
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL?.trim() || ""

export const MAIL_FROM_DISPLAY_NAME =
  process.env.MAIL_FROM_DISPLAY_NAME?.trim() || APP_DISPLAY_NAME

/** `from` header for Resend (must use a verified domain or Resend onboarding address). */
export function getResendFrom(): string {
  const full = process.env.RESEND_FROM?.trim()
  if (full) return full
  if (!RESEND_FROM_EMAIL) {
    throw new Error(
      'Set RESEND_FROM (e.g. "Vertex PM <mail@yourdomain.com>") or RESEND_FROM_EMAIL for Resend.',
    )
  }
  return `${MAIL_FROM_DISPLAY_NAME} <${RESEND_FROM_EMAIL}>`
}
