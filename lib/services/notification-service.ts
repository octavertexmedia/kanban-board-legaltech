import { User, Ticket } from "@/lib/types"
import { notificationToSendEmailPayload } from "@/lib/email/notification-email-payload"
import { getInternalAppOrigin } from "@/lib/email/internal-app-origin"

type NotificationType =
  | "ticket_assigned"
  | "ticket_mentioned"
  | "ticket_status_change"
  | "meeting_scheduled"
  | "meeting_reminder"
  | "project_created"
  | "document_shared"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  createdAt: string
  readAt?: string | null
  user: User
  linkTo?: string
}

class NotificationService {
  private notifications: Notification[] = []

  constructor() {
    // Service initialized
  }

  async notify(
    user: User,
    type: NotificationType,
    data: any,
    sendEmail: boolean = true
  ): Promise<Notification> {
    const notification = this.createNotification(user, type, data)

    this.notifications.push(notification)

    if (sendEmail) {
      await this.dispatchNotificationEmail(user, type, data)
    }

    return notification
  }

  private async dispatchNotificationEmail(
    user: User,
    type: NotificationType,
    data: any
  ): Promise<void> {
    try {
      const payload = notificationToSendEmailPayload(user, type, data as Record<string, unknown>)
      if (!payload) {
        console.log(`[Email] Notification "${type}" has no SES template mapping.`)
        return
      }

      const origin =
        typeof window !== "undefined" ? "" : getInternalAppOrigin()
      const url = `${origin}/api/send-email`
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (typeof window === "undefined") {
        const secret = process.env.INTERNAL_EMAIL_WORKER_SECRET?.trim()
        if (secret) {
          const { EMAIL_WORKER_SECRET_HEADER } = await import(
            "@/lib/email/send-email-auth"
          )
          headers[EMAIL_WORKER_SECRET_HEADER] = secret
        } else {
          console.warn(
            "[Email] INTERNAL_EMAIL_WORKER_SECRET is unset — server-triggered emails " +
              "will fail auth unless the route forwards a user session. Set it in .env for API/cron sends."
          )
        }
      }
      const response = await fetch(url, {
        method: "POST",
        headers,
        credentials: typeof window !== "undefined" ? "include" : "omit",
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error(`[Email] Dispatch failed for ${type}:`, err)
      } else {
        console.log(`[Email] Sent for ${type} to ${user.email}`)
      }
    } catch (error) {
      console.error(`Failed to send email for ${type}:`, error)
    }
  }

  private createNotification(user: User, type: NotificationType, data: any): Notification {
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const createdAt = new Date().toISOString()

    let title = ""
    let message = ""
    let linkTo = ""

    switch (type) {
      case "ticket_assigned":
        title = "Ticket Assigned"
        message = `Ticket "${data.title}" has been assigned to you${data.assignedBy ? ` by ${data.assignedBy.name}` : ""}`
        linkTo = `/projects/${data.projectId}?ticket=${data.ticketId}`
        break

      case "ticket_mentioned": {
        const actor = data.mentionedBy?.name || "Someone"
        const isUsernameMention = data.mentionKind === "username_mention"
        if (isUsernameMention) {
          title = "You were mentioned"
          message = `${actor} mentioned you in ticket "${data.title}"`
        } else {
          title = "New comment on your ticket"
          message = `${actor} commented on "${data.title}"`
        }
        linkTo = `/projects/${data.projectId}?ticket=${data.ticketId}`
        break
      }

      case "ticket_status_change":
        title = "Ticket Status Changed"
        message = `Ticket "${data.title}" was moved to ${data.newStatus}${data.changedBy ? ` by ${data.changedBy.name}` : ""}`
        linkTo = `/projects/${data.projectId}?ticket=${data.ticketId}`
        break

      case "meeting_scheduled":
        title = "New Meeting"
        message = `${data.organizer?.name || "Someone"} scheduled a meeting: ${data.title}`
        linkTo = `/meetings`
        break

      case "meeting_reminder":
        title = "Meeting Reminder"
        message = `Reminder: ${data.title} starts in ${data.timeRemaining}`
        linkTo = `/meetings`
        break

      case "project_created":
        title = "New Project"
        message = `You've been added to project "${data.projectName}"${data.createdBy ? ` by ${data.createdBy.name}` : ""}`
        linkTo = `/projects/${data.projectId}`
        break

      case "document_shared":
        title = "Document Shared"
        message = `${data.sharedBy.name} shared "${data.documentName}" with you`
        linkTo = `/documents/${data.documentId}`
        break
    }

    return {
      id,
      type,
      title,
      message,
      createdAt,
      readAt: null,
      user,
      linkTo,
    }
  }

  getUserNotifications(userId: string): Notification[] {
    return this.notifications
      .filter((n) => n.user.id === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }

  getUnreadCount(userId: string): number {
    return this.notifications.filter((n) => n.user.id === userId && !n.readAt)
      .length
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find((n) => n.id === notificationId)
    if (notification) {
      notification.readAt = new Date().toISOString()
    }
  }

  markAllAsRead(userId: string): void {
    this.notifications
      .filter((n) => n.user.id === userId && !n.readAt)
      .forEach((n) => {
        n.readAt = new Date().toISOString()
      })
  }

  async processMentions(
    ticketId: string,
    comment: string,
    mentionedBy: User,
    ticket: Ticket,
    projectId: string
  ): Promise<void> {
    const mentionRegex = /@(\w+)/g
    const mentions = comment.match(mentionRegex) || []

    for (const mention of mentions) {
      const username = mention.substring(1)

      const mockUser = {
        id: "user-mentioned",
        name: username,
        email: `${username}@example.com`,
        role: "engineer",
        status: "active",
        lastActive: new Date().toISOString(),
        avatar: "/placeholder.svg",
      }

      await this.notify(mockUser, "ticket_mentioned", {
        ticketId,
        projectId,
        title: ticket.title,
        mentionedBy,
        user: mockUser,
        commentText: comment,
        mentionKind: "username_mention",
      })
    }
  }
}

export const notificationService = new NotificationService()
