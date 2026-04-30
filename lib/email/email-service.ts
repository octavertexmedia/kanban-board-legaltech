// Client-side email service that calls our API routes
export class EmailService {
    private static async sendEmail(type: string, to: string | string[], data: any) {
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ type, to, data }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Email failed:', result.error);
                return { success: false, error: result.error };
            }

            return { success: true, data: result.data };
        } catch (error: any) {
            console.error('Email service error:', error);
            return { success: false, error: error.message };
        }
    }

    static async sendTeamInvite(params: {
        to: string;
        inviteeName: string;
        inviterName: string;
        teamName: string;
        role: string;
    }) {
        return this.sendEmail('team_invite', params.to, {
            inviteeName: params.inviteeName,
            inviterName: params.inviterName,
            teamName: params.teamName,
            role: params.role,
        });
    }

    static async sendTicketAssigned(params: {
        to: string;
        assigneeName: string;
        assignerName: string;
        ticketTitle: string;
        ticketDescription: string;
        priority: string;
        dueDate: string;
        projectName: string;
        projectId: string;
        ticketId: string;
    }) {
        return this.sendEmail('ticket_assigned', params.to, params);
    }

    static async sendMeetingInvite(params: {
        to: string[];
        attendeeName: string;
        organizerName: string;
        meetingTitle: string;
        meetingDescription: string;
        date: string;
        startTime: string;
        endTime: string;
        meetLink: string;
        attendees: string[];
    }) {
        return this.sendEmail('meeting_invite', params.to, params);
    }

    static async sendTicketStatusChange(params: {
        to: string;
        recipientName: string;
        changerName: string;
        ticketTitle: string;
        oldStatus: string;
        newStatus: string;
        projectName: string;
        projectId: string;
        ticketId: string;
    }) {
        return this.sendEmail('ticket_status_change', params.to, params);
    }

    static async sendProjectCreated(params: {
        to: string[];
        memberName: string;
        creatorName: string;
        projectName: string;
        projectDescription: string;
        projectId: string;
    }) {
        return this.sendEmail('project_created', params.to, params);
    }

    static async sendWeeklyDigest(params: {
        to: string;
        userName: string;
        ticketsCompleted: number;
        ticketsPending: number;
        meetingsThisWeek: number;
        teamUpdates: string[];
    }) {
        return this.sendEmail('weekly_digest', params.to, params);
    }
}
