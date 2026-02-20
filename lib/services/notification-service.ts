import { User, Ticket } from "@/lib/types";
import { EmailService } from "@/lib/email/email-service";

type NotificationType =
  | "ticket_assigned"
  | "ticket_mentioned"
  | "ticket_status_change"
  | "meeting_scheduled"
  | "meeting_reminder"
  | "project_created"
  | "document_shared";

interface EmailTemplate {
  subject: string;
  body: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
  user: User;
  linkTo?: string;
}

class NotificationService {
  private notifications: Notification[] = [];

  constructor() {
    // Service initialized
  }

  // Create a notification and optionally send email via Resend
  async notify(
    user: User,
    type: NotificationType,
    data: any,
    sendEmail: boolean = true
  ): Promise<Notification> {
    const notification = this.createNotification(user, type, data);

    this.notifications.push(notification);

    if (sendEmail) {
      await this.sendEmailViaResend(user, type, data, notification);
    }

    return notification;
  }

  // Send email via Resend based on notification type
  private async sendEmailViaResend(
    user: User,
    type: NotificationType,
    data: any,
    notification: Notification
  ): Promise<void> {
    try {
      const resend = (await import("@/lib/email/resend-client")).default;
      const { FROM_EMAIL } = await import("@/lib/email/resend-client");
      const templates = await import("@/lib/email/templates");

      let emailContent: { subject: string; html: string } | null = null;

      switch (type) {
        case "ticket_assigned":
          emailContent = templates.ticketAssignedEmail({
            assigneeName: user.name,
            assignerName: data.assignedBy?.name || "Team",
            ticketTitle: data.title,
            ticketDescription: data.description || "",
            priority: data.priority || "medium",
            dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString() : "Not set",
            projectName: data.projectName || "Project",
            projectId: data.projectId || "",
            ticketId: data.ticketId || "",
          });
          break;

        case "meeting_scheduled":
          emailContent = templates.meetingInviteEmail({
            attendeeName: user.name,
            organizerName: data.organizer?.name || "Team",
            meetingTitle: data.title,
            meetingDescription: data.description || "",
            date: data.date || "",
            startTime: data.startTime || "",
            endTime: data.endTime || "",
            meetLink: data.meetLink || "",
            attendees: data.attendees?.map((a: User) => a.name) || [],
          });
          break;

        case "project_created":
          emailContent = templates.projectCreatedEmail({
            memberName: user.name,
            creatorName: data.createdBy?.name || "Team",
            projectName: data.projectName,
            projectDescription: data.description || "",
            projectId: data.projectId,
          });
          break;

        case "ticket_status_change":
          emailContent = templates.ticketStatusChangeEmail({
            recipientName: user.name,
            changerName: data.changedBy?.name || "Team",
            ticketTitle: data.title,
            oldStatus: data.oldStatus || "",
            newStatus: data.newStatus || "",
            projectName: data.projectName || "Project",
            projectId: data.projectId || "",
            ticketId: data.ticketId || "",
          });
          break;

        default:
          console.log(`[Email] Notification "${type}" no template mapped.`);
      }

      if (emailContent) {
        await resend.emails.send({
          from: `Cengineers Kanban <${FROM_EMAIL}>`,
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
        console.log(`[Email] Successfully dispatched Resend hook for ${type} to ${user.email}`);
      }
    } catch (error) {
      console.error(`Failed to send email for ${type}:`, error);
    }
  }

  // Create notification object based on type and data
  private createNotification(user: User, type: NotificationType, data: any): Notification {
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();

    let title = "";
    let message = "";
    let linkTo = "";

    switch (type) {
      case "ticket_assigned":
        title = "Ticket Assigned";
        message = `Ticket "${data.title}" has been assigned to you${data.assignedBy ? ` by ${data.assignedBy.name}` : ''}`;
        linkTo = `/projects/${data.projectId}?ticket=${data.ticketId}`;
        break;

      case "ticket_mentioned":
        title = "You were mentioned";
        message = `${data.mentionedBy.name} mentioned you in ticket "${data.title}"`;
        linkTo = `/projects/${data.projectId}?ticket=${data.ticketId}`;
        break;

      case "ticket_status_change":
        title = "Ticket Status Changed";
        message = `Ticket "${data.title}" was moved to ${data.newStatus}${data.changedBy ? ` by ${data.changedBy.name}` : ''}`;
        linkTo = `/projects/${data.projectId}?ticket=${data.ticketId}`;
        break;

      case "meeting_scheduled":
        title = "New Meeting";
        message = `${data.organizer?.name || 'Someone'} scheduled a meeting: ${data.title}`;
        linkTo = `/meetings`;
        break;

      case "meeting_reminder":
        title = "Meeting Reminder";
        message = `Reminder: ${data.title} starts in ${data.timeRemaining}`;
        linkTo = `/meetings`;
        break;

      case "project_created":
        title = "New Project";
        message = `You've been added to project "${data.projectName}"${data.createdBy ? ` by ${data.createdBy.name}` : ''}`;
        linkTo = `/projects/${data.projectId}`;
        break;

      case "document_shared":
        title = "Document Shared";
        message = `${data.sharedBy.name} shared "${data.documentName}" with you`;
        linkTo = `/documents/${data.documentId}`;
        break;
    }

    return {
      id,
      type,
      title,
      message,
      createdAt,
      readAt: null,
      user,
      linkTo
    };
  }

  // Get notifications for a specific user
  getUserNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.user.id === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get unread count
  getUnreadCount(userId: string): number {
    return this.notifications.filter(n => n.user.id === userId && !n.readAt).length;
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.readAt = new Date().toISOString();
    }
  }

  // Mark all notifications for a user as read
  markAllAsRead(userId: string): void {
    this.notifications
      .filter(n => n.user.id === userId && !n.readAt)
      .forEach(n => n.readAt = new Date().toISOString());
  }

  // Process mention in ticket comments
  async processMentions(ticketId: string, comment: string, mentionedBy: User, ticket: Ticket, projectId: string): Promise<void> {
    const mentionRegex = /@(\w+)/g;
    const mentions = comment.match(mentionRegex) || [];

    for (const mention of mentions) {
      const username = mention.substring(1);

      const mockUser = {
        id: "user-mentioned",
        name: username,
        email: `${username}@example.com`,
        role: "engineer",
        status: "active",
        lastActive: new Date().toISOString(),
        avatar: "/placeholder.svg"
      };

      await this.notify(mockUser, "ticket_mentioned", {
        ticketId,
        projectId,
        title: ticket.title,
        mentionedBy,
        user: mockUser,
        commentText: comment
      });
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
