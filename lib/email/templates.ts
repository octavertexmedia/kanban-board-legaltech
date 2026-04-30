import { APP_URL } from '@/lib/email/mail-config';
import { APP_DISPLAY_NAME, OCTAVERTEX_LOGO_URL } from '@/lib/brand';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Plain-text fragments used in email Subject headers (not HTML-escaped). */
function subjectSafe(text: string): string {
  return text.replace(/[\r\n\u0000]+/g, ' ').trim().slice(0, 200);
}

// Shared email wrapper with premium design
function emailWrapper(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_DISPLAY_NAME}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7f1d1d 0%,#ff3131 100%);padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <img src="${OCTAVERTEX_LOGO_URL}" alt="OctaVertex Media" width="200" height="48" style="max-height:48px;width:auto;display:block;border:0;outline:none;text-decoration:none;" />
                    <div style="color:rgba(255,255,255,0.92);font-size:14px;font-weight:600;margin-top:10px;letter-spacing:0.02em;">${APP_DISPLAY_NAME}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#94a3b8;font-size:12px;line-height:1.6;">
                    <p style="margin:0;">This email was sent by <strong style="color:#64748b;">${APP_DISPLAY_NAME}</strong> (OctaVertex Media).</p>
                    <p style="margin:4px 0 0 0;">
                      <a href="${APP_URL}/settings" style="color:#dc2626;text-decoration:none;">Manage notification preferences</a> · 
                      <a href="${APP_URL}" style="color:#dc2626;text-decoration:none;">Open app</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="color:#94a3b8;font-size:11px;margin-top:16px;">© ${new Date().getFullYear()} OctaVertex Media. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Primary CTA button
function ctaButton(label: string, url: string, color: string = '#ff3131'): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background-color:${color};border-radius:8px;padding:12px 28px;">
          <a href="${url}" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">${label}</a>
        </td>
      </tr>
    </table>`;
}

// Priority badge
function priorityBadge(priority: string): string {
  const colors: Record<string, { bg: string; text: string }> = {
    high: { bg: '#fef2f2', text: '#dc2626' },
    medium: { bg: '#fff7ed', text: '#ea580c' },
    low: { bg: '#f0fdf4', text: '#16a34a' },
  };
  const c = colors[priority.toLowerCase()] || colors.medium;
  return `<span style="display:inline-block;padding:2px 10px;border-radius:12px;background:${c.bg};color:${c.text};font-size:12px;font-weight:600;text-transform:capitalize;">${priority}</span>`;
}

// ====== EMAIL TEMPLATES ======

export function teamInviteEmail(data: {
  inviteeName: string;
  inviterName: string;
  teamName: string;
  role: string;
}): { subject: string; html: string } {
  return {
    subject: `🎉 You've been invited to ${data.teamName} on ${APP_DISPLAY_NAME}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">You're Invited! 🎉</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">
        <strong style="color:#1e293b;">${data.inviterName}</strong> has invited you to join 
        <strong style="color:#1e293b;">${data.teamName}</strong> as a <strong style="color:#2962FF;">${data.role}</strong>.
      </p>
      
      <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:0 0 24px;border:1px solid #e2e8f0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;">
              <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Team</span><br>
              <span style="color:#1e293b;font-size:14px;font-weight:500;">${data.teamName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;">
              <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Your Role</span><br>
              <span style="color:#1e293b;font-size:14px;font-weight:500;">${data.role}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;">
              <span style="color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Invited By</span><br>
              <span style="color:#1e293b;font-size:14px;font-weight:500;">${data.inviterName}</span>
            </td>
          </tr>
        </table>
      </div>

      ${ctaButton('Accept Invitation & Join Team', `${APP_URL}/register`, '#2962FF')}
      
      <p style="color:#94a3b8;font-size:13px;margin:0;">
        If you didn't expect this invite, you can safely ignore this email.
      </p>
    `, `${data.inviterName} invited you to ${data.teamName}`)
  };
}

export function ticketAssignedEmail(data: {
  assigneeName: string;
  assignerName: string;
  ticketTitle: string;
  ticketDescription: string;
  priority: string;
  dueDate: string;
  projectName: string;
  projectId: string;
  ticketId: string;
}): { subject: string; html: string } {
  return {
    subject: `📋 Ticket Assigned: ${data.ticketTitle}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">New Ticket Assigned</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">
        <strong style="color:#1e293b;">${data.assignerName}</strong> assigned a ticket to you in 
        <strong style="color:#2962FF;">${data.projectName}</strong>.
      </p>
      
      <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;border-left:4px solid #2962FF;">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1e293b;">${data.ticketTitle}</h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 16px;">${data.ticketDescription}</p>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:16px;">
              <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Priority</span><br>
              ${priorityBadge(data.priority)}
            </td>
            <td>
              <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Due Date</span><br>
              <span style="color:#1e293b;font-size:13px;font-weight:500;">${data.dueDate}</span>
            </td>
          </tr>
        </table>
      </div>

      ${ctaButton('View Ticket', `${APP_URL}/projects/${data.projectId}?ticket=${data.ticketId}`)}
    `, `New ticket: ${data.ticketTitle}`)
  };
}

export function ticketMentionedEmail(data: {
  recipientName: string;
  actorName: string;
  ticketTitle: string;
  projectName: string;
  projectId: string;
  ticketId: string;
  snippet: string;
  mentionKind: 'comment' | 'username_mention';
}): { subject: string; html: string } {
  const e = escapeHtml;
  const isMention = data.mentionKind === 'username_mention';
  const headline = isMention ? 'You were mentioned' : 'New comment on your ticket';
  const lead = isMention
    ? `<strong style="color:#1e293b;">${e(data.actorName)}</strong> mentioned you in a ticket on <strong style="color:#c2410c;">${e(data.projectName)}</strong>.`
    : `<strong style="color:#1e293b;">${e(data.actorName)}</strong> commented on your ticket in <strong style="color:#c2410c;">${e(data.projectName)}</strong>.`;
  const snippetBlock = data.snippet
    ? `<div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin:0 0 24px;border:1px solid #e2e8f0;border-left:4px solid #ea580c;">
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.65;white-space:pre-wrap;">${e(data.snippet)}</p>
      </div>`
    : '';
  return {
    subject: isMention
      ? `✉️ ${subjectSafe(data.actorName)} mentioned you — ${subjectSafe(data.ticketTitle)}`
      : `💬 New comment — ${subjectSafe(data.ticketTitle)}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">${headline}</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 20px;">${lead}</p>
      <div style="margin:0 0 16px;">
        <h2 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#1e293b;">${e(data.ticketTitle)}</h2>
        <p style="margin:0;color:#94a3b8;font-size:12px;">${e(data.projectName)}</p>
      </div>
      ${snippetBlock}
      ${ctaButton('Open ticket', `${APP_URL}/projects/${encodeURIComponent(data.projectId)}?ticket=${encodeURIComponent(data.ticketId)}`, '#ea580c')}
    `, isMention ? `Mention in ${data.ticketTitle}` : `Comment on ${data.ticketTitle}`),
  };
}

export function meetingInviteEmail(data: {
  attendeeName: string;
  organizerName: string;
  meetingTitle: string;
  meetingDescription: string;
  date: string;
  startTime: string;
  endTime: string;
  meetLink: string;
  attendees: string[];
}): { subject: string; html: string } {
  return {
    subject: `📅 Meeting: ${data.meetingTitle} — ${data.date}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">Meeting Invitation</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">
        <strong style="color:#1e293b;">${data.organizerName}</strong> invited you to a meeting.
      </p>
      
      <div style="background:linear-gradient(135deg,#eff6ff 0%,#eef2ff 100%);border-radius:12px;padding:24px;margin:0 0 24px;border:1px solid #c7d2fe;">
        <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#1e293b;">${data.meetingTitle}</h2>
        ${data.meetingDescription ? `<p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 20px;">${data.meetingDescription}</p>` : ''}
        
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;">
              <span style="color:#6366f1;font-size:16px;margin-right:8px;">📅</span>
              <span style="color:#1e293b;font-size:14px;font-weight:500;">${data.date}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;">
              <span style="color:#6366f1;font-size:16px;margin-right:8px;">🕐</span>
              <span style="color:#1e293b;font-size:14px;font-weight:500;">${data.startTime} — ${data.endTime}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;">
              <span style="color:#6366f1;font-size:16px;margin-right:8px;">👥</span>
              <span style="color:#1e293b;font-size:14px;font-weight:500;">${data.attendees.join(', ')}</span>
            </td>
          </tr>
        </table>
      </div>

      ${ctaButton('Join Meeting', data.meetLink, '#6366f1')}

      <p style="color:#94a3b8;font-size:13px;margin:16px 0 0;">
        <a href="${APP_URL}/meetings" style="color:#2962FF;text-decoration:none;">View in Calendar →</a>
      </p>
    `, `${data.meetingTitle} on ${data.date}`)
  };
}

export function meetingReminderEmail(data: {
  recipientName: string;
  organizerName: string;
  meetingTitle: string;
  date: string;
  startTime: string;
  timeRemaining: string;
  meetLink: string;
}): { subject: string; html: string } {
  const e = escapeHtml;
  return {
    subject: `⏰ Reminder: ${subjectSafe(data.meetingTitle)} (${subjectSafe(data.timeRemaining)})`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">Meeting reminder</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 20px;">
        Hi <strong style="color:#1e293b;">${e(data.recipientName)}</strong>, this is a quick reminder from <strong style="color:#1e293b;">${e(data.organizerName)}</strong>.
      </p>
      <div style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border-radius:12px;padding:22px;margin:0 0 24px;border:1px solid #fcd34d;">
        <h2 style="margin:0 0 10px;font-size:19px;font-weight:600;color:#1e293b;">${e(data.meetingTitle)}</h2>
        <p style="margin:0 0 8px;color:#92400e;font-size:14px;"><strong>When:</strong> ${e(data.date)} · ${e(data.startTime)}</p>
        <p style="margin:0;color:#b45309;font-size:15px;font-weight:600;">Starts in ${e(data.timeRemaining)}</p>
      </div>
      ${data.meetLink ? ctaButton('Join or view meeting', data.meetLink, '#d97706') : ctaButton('View meetings', `${APP_URL}/meetings`, '#d97706')}
    `, `Reminder: ${data.meetingTitle}`),
  };
}

export function ticketStatusChangeEmail(data: {
  recipientName: string;
  changerName: string;
  ticketTitle: string;
  oldStatus: string;
  newStatus: string;
  projectName: string;
  projectId: string;
  ticketId: string;
}): { subject: string; html: string } {
  return {
    subject: `🔄 Ticket Updated: ${data.ticketTitle} → ${data.newStatus}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">Ticket Status Changed</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">
        <strong style="color:#1e293b;">${data.changerName}</strong> updated a ticket in 
        <strong style="color:#2962FF;">${data.projectName}</strong>.
      </p>
      
      <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:0 0 24px;border:1px solid #e2e8f0;">
        <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1e293b;">${data.ticketTitle}</h2>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 12px;background:#fee2e2;color:#991b1b;border-radius:8px;font-size:13px;font-weight:500;">
              ${data.oldStatus}
            </td>
            <td style="padding:0 12px;color:#94a3b8;font-size:18px;">→</td>
            <td style="padding:4px 12px;background:#dcfce7;color:#166534;border-radius:8px;font-size:13px;font-weight:500;">
              ${data.newStatus}
            </td>
          </tr>
        </table>
      </div>

      ${ctaButton('View Ticket', `${APP_URL}/projects/${data.projectId}?ticket=${data.ticketId}`)}
    `, `${data.ticketTitle} moved to ${data.newStatus}`)
  };
}

export function projectCreatedEmail(data: {
  memberName: string;
  creatorName: string;
  projectName: string;
  projectDescription: string;
  projectId: string;
}): { subject: string; html: string } {
  return {
    subject: `🚀 New Project: ${data.projectName}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">New Project Created</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">
        <strong style="color:#1e293b;">${data.creatorName}</strong> added you to a new project.
      </p>
      
      <div style="background:linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%);border-radius:12px;padding:24px;margin:0 0 24px;border:1px solid #bbf7d0;">
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#1e293b;">${data.projectName} 🚀</h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0;">${data.projectDescription}</p>
      </div>

      ${ctaButton('Open Project', `${APP_URL}/projects/${data.projectId}`, '#16a34a')}
    `, `You've been added to ${data.projectName}`)
  };
}

export function weeklyDigestEmail(data: {
  userName: string;
  ticketsCompleted: number;
  ticketsPending: number;
  meetingsThisWeek: number;
  teamUpdates: string[];
}): { subject: string; html: string } {
  return {
    subject: `📊 Your Weekly Digest — ${APP_DISPLAY_NAME}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">Weekly Digest 📊</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Hi <strong style="color:#1e293b;">${data.userName}</strong>, here's your weekly summary.
      </p>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="width:33%;padding:8px;">
            <div style="background:#eff6ff;border-radius:12px;padding:20px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#2962FF;">${data.ticketsCompleted}</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">Completed</div>
            </div>
          </td>
          <td style="width:33%;padding:8px;">
            <div style="background:#fff7ed;border-radius:12px;padding:20px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#ea580c;">${data.ticketsPending}</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">Pending</div>
            </div>
          </td>
          <td style="width:33%;padding:8px;">
            <div style="background:#eef2ff;border-radius:12px;padding:20px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#6366f1;">${data.meetingsThisWeek}</div>
              <div style="font-size:12px;color:#64748b;margin-top:4px;">Meetings</div>
            </div>
          </td>
        </tr>
      </table>

      ${data.teamUpdates.length > 0 ? `
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#1e293b;">Team Updates</h3>
        <ul style="margin:0 0 24px;padding-left:20px;">
          ${data.teamUpdates.map(u => `<li style="color:#64748b;font-size:14px;line-height:2;">${u}</li>`).join('')}
        </ul>
      ` : ''}

      ${ctaButton('View Dashboard', APP_URL)}
    `, `${data.ticketsCompleted} tickets completed, ${data.ticketsPending} pending`)
  };
}

export function passwordResetEmail(data: {
  userName: string;
  resetLink: string;
}): { subject: string; html: string } {
  return {
    subject: `🔒 Reset Your Password — ${APP_DISPLAY_NAME}`,
    html: emailWrapper(`
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1e293b;">Password Reset Request</h1>
      <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Hi <strong style="color:#1e293b;">${data.userName}</strong>, we received a request to reset your password.
      </p>
      
      <div style="background:#fffbeb;border-radius:12px;padding:24px;margin:0 0 24px;border:1px solid #fde68a;">
        <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#92400e;">Secure Link Generated</h2>
        <p style="color:#92400e;font-size:14px;line-height:1.6;margin:0;">This link will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
      </div>

      ${ctaButton('Reset Password', data.resetLink, '#2962FF')}

      <p style="color:#94a3b8;font-size:13px;margin:24px 0 0;">
        Alternatively, copy to your browser: <br/>
        <code style="background:#f1f5f9;padding:4px 8px;border-radius:4px;word-break:break-all;color:#475569;">${data.resetLink}</code>
      </p>
    `, `Reset your ${APP_DISPLAY_NAME} password`)
  };
}
