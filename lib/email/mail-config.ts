import { APP_DISPLAY_NAME } from "@/lib/brand"

/** Public app URL (links in emails). Defaults to production CRM host. */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://kanban.vertexcrm.in"

/** Verified SES identity (email must be verified in AWS SES). */
export const AWS_SES_FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL?.trim() || ""

export const MAIL_FROM_DISPLAY_NAME =
  process.env.MAIL_FROM_DISPLAY_NAME?.trim() || APP_DISPLAY_NAME

export function getSesFromSource(): string {
  if (!AWS_SES_FROM_EMAIL) {
    throw new Error(
      "AWS_SES_FROM_EMAIL is not set. Add a verified sender email from AWS SES."
    )
  }
  return `${MAIL_FROM_DISPLAY_NAME} <${AWS_SES_FROM_EMAIL}>`
}
