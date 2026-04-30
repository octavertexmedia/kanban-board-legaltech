import "server-only"

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import { getSesFromSource } from "@/lib/email/mail-config"

function getSesClient(): SESClient {
  const region =
    process.env.AWS_SES_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    "us-east-1"
  return new SESClient({ region })
}

export async function sendTransactionalEmail(params: {
  to: string | string[]
  subject: string
  html: string
}): Promise<{ messageId?: string }> {
  const toAddresses = Array.isArray(params.to) ? params.to : [params.to]
  const client = getSesClient()
  const out = await client.send(
    new SendEmailCommand({
      Source: getSesFromSource(),
      Destination: { ToAddresses: toAddresses },
      Message: {
        Subject: { Data: params.subject, Charset: "UTF-8" },
        Body: { Html: { Data: params.html, Charset: "UTF-8" } },
      },
    })
  )
  return { messageId: out.MessageId }
}
