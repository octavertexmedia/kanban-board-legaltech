import "server-only"

import { Resend } from "resend"
import { getResendFrom } from "@/lib/email/mail-config"

let client: Resend | null = null

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add your Resend API key to send transactional email.",
    )
  }
  if (!client) client = new Resend(key)
  return client
}

export async function sendTransactionalEmail(params: {
  to: string | string[]
  subject: string
  html: string
}): Promise<{ messageId?: string }> {
  const to = Array.isArray(params.to) ? params.to : [params.to]
  const { data, error } = await getResend().emails.send({
    from: getResendFrom(),
    to,
    subject: params.subject,
    html: params.html,
  })
  if (error) {
    throw new Error(error.message)
  }
  return { messageId: data?.id }
}
