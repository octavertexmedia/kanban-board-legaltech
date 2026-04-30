import {
  teamInviteEmail,
  ticketAssignedEmail,
  ticketMentionedEmail,
  meetingInviteEmail,
  meetingReminderEmail,
  ticketStatusChangeEmail,
  projectCreatedEmail,
  weeklyDigestEmail,
} from "@/lib/email/templates"

export function resolveEmailContent(
  type: string,
  data: Record<string, unknown>
): { subject: string; html: string } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any
  switch (type) {
    case "team_invite":
      return teamInviteEmail(d)
    case "ticket_assigned":
      return ticketAssignedEmail(d)
    case "ticket_mentioned":
      return ticketMentionedEmail(d)
    case "meeting_invite":
      return meetingInviteEmail(d)
    case "meeting_reminder":
      return meetingReminderEmail(d)
    case "ticket_status_change":
      return ticketStatusChangeEmail(d)
    case "project_created":
      return projectCreatedEmail(d)
    case "weekly_digest":
      return weeklyDigestEmail(d)
    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}
