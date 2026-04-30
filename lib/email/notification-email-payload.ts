import type { User } from "@/lib/types"

function truncateText(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

/** Maps in-app notification events to `/api/send-email` payloads. */
export function notificationToSendEmailPayload(
  user: Pick<User, "email" | "name">,
  type: string,
  data: Record<string, unknown>
): { type: string; to: string | string[]; data: Record<string, unknown> } | null {
  switch (type) {
    case "ticket_assigned":
      return {
        type: "ticket_assigned",
        to: user.email,
        data: {
          assigneeName: user.name,
          assignerName: (data.assignedBy as { name?: string } | undefined)?.name || "Team",
          ticketTitle: data.title,
          ticketDescription: data.description || "",
          priority: data.priority || "medium",
          dueDate: data.dueDate
            ? new Date(data.dueDate as string).toLocaleDateString()
            : "Not set",
          projectName: data.projectName || "Project",
          projectId: data.projectId || "",
          ticketId: data.ticketId || "",
        },
      }
    case "meeting_scheduled":
      return {
        type: "meeting_invite",
        to: user.email,
        data: {
          attendeeName: user.name,
          organizerName: (data.organizer as { name?: string } | undefined)?.name || "Team",
          meetingTitle: data.title,
          meetingDescription: data.description || "",
          date: data.date || "",
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          meetLink: data.meetLink || "",
          attendees:
            (data.attendees as { name: string }[] | undefined)?.map((a) => a.name) || [],
        },
      }
    case "project_created":
      return {
        type: "project_created",
        to: user.email,
        data: {
          memberName: user.name,
          creatorName: (data.createdBy as { name?: string } | undefined)?.name || "Team",
          projectName: data.projectName,
          projectDescription: data.description || "",
          projectId: data.projectId,
        },
      }
    case "ticket_status_change":
      return {
        type: "ticket_status_change",
        to: user.email,
        data: {
          recipientName: user.name,
          changerName: (data.changedBy as { name?: string } | undefined)?.name || "Team",
          ticketTitle: data.title,
          oldStatus: data.oldStatus || "",
          newStatus: data.newStatus || "",
          projectName: data.projectName || "Project",
          projectId: data.projectId || "",
          ticketId: data.ticketId || "",
        },
      }
    case "ticket_mentioned": {
      const mentionKind =
        data.mentionKind === "username_mention" ? "username_mention" : "comment"
      const snippetRaw = String(data.commentText ?? "")
      return {
        type: "ticket_mentioned",
        to: user.email,
        data: {
          recipientName: user.name,
          actorName:
            (data.mentionedBy as { name?: string } | undefined)?.name || "Someone",
          ticketTitle: String(data.title ?? "Ticket"),
          projectName: String(data.projectName ?? "Project"),
          projectId: String(data.projectId ?? ""),
          ticketId: String(data.ticketId ?? ""),
          snippet: truncateText(snippetRaw, 400),
          mentionKind,
        },
      }
    }
    case "meeting_reminder":
      return {
        type: "meeting_reminder",
        to: user.email,
        data: {
          recipientName: user.name,
          organizerName:
            (data.organizer as { name?: string } | undefined)?.name || "Team",
          meetingTitle: String(data.title ?? "Meeting"),
          date: String(data.date ?? ""),
          startTime: String(data.startTime ?? ""),
          timeRemaining: String(data.timeRemaining ?? "soon"),
          meetLink: String(data.meetLink ?? ""),
        },
      }
    default:
      return null
  }
}
