import { NextRequest, NextResponse } from "next/server"
import { resolveEmailContent } from "@/lib/email/resolve-email-content"
import { sendTransactionalEmail } from "@/lib/email/send-transactional"
import { isSendEmailAuthorized } from "@/lib/email/send-email-auth"

export async function POST(req: NextRequest) {
  try {
    if (!(await isSendEmailAuthorized(req))) {
      return NextResponse.json(
        {
          error:
            "Unauthorized — sign in or provide a valid x-email-worker-secret for server-side email.",
        },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { type, to, data } = body

    if (!to || !type) {
      return NextResponse.json(
        { error: "Missing required fields: to, type" },
        { status: 400 }
      )
    }

    const emailContent = resolveEmailContent(type, data ?? {})

    const result = await sendTransactionalEmail({
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send email"
    console.error("Email sending failed:", error)
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
