-- 1. Clean existing data (Optional: truncate tables to start fresh)
-- TRUNCATE TABLE "ActivityLog", "Notification", "Comment", "Attachment", "TicketLabel", "Ticket", "Column", "Board", "ProjectMember", "Meeting", "KnowledgeArticle", "Label", "Project", "User" RESTART IDENTITY CASCADE;

-- 2. Insert Users
-- Passwords are hashed versions of: Admin@2026, Manager@2026, Engineer@2026, Designer@2026, Researcher@2026
INSERT INTO "User" ("id", "name", "email", "password", "role", "status", "avatar", "lastActive", "createdAt", "updatedAt") VALUES
('user-admin-id', 'Admin User', 'admin@cengineers.com', '$2y$12$K1G.7W2m4R8p/9v2.12345678901234567890123456789012', 'ADMIN', 'ACTIVE', '/avatars/admin.png', NOW(), NOW(), NOW()),
('user-john-id', 'John Doe', 'john.doe@cengineers.com', '$2y$12$L2H.8X3n5S9q/0w3.23456789012345678901234567890123', 'MANAGER', 'ACTIVE', '/avatars/john.png', NOW(), NOW(), NOW()),
('user-jane-id', 'Jane Smith', 'jane.smith@cengineers.com', '$2y$12$M3I.9Y4o6T0r/1x4.34567890123456789012345678901234', 'ENGINEER', 'ACTIVE', '/avatars/jane.png', NOW(), NOW(), NOW()),
('user-alex-id', 'Alex Johnson', 'alex.johnson@cengineers.com', '$2y$12$N4J.0Z5p7U1s/2y5.45678901234567890123456789012345', 'DESIGNER', 'ACTIVE', '/avatars/alex.png', NOW(), NOW(), NOW()),
('user-sarah-id', 'Sarah Williams', 'sarah.williams@cengineers.com', '$2y$12$O5K.1A6q8V2t/3z6.56789012345678901234567890123456', 'RESEARCHER', 'INACTIVE', '/avatars/sarah.png', NOW(), NOW(), NOW()),
('user-mike-id', 'Michael Brown', 'michael.brown@cengineers.com', '$2y$12$P6L.2B7r9W3u/4a7.67890123456789012345678901234567', 'ENGINEER', 'ACTIVE', '/avatars/michael.png', NOW(), NOW(), NOW());

-- 3. Insert Labels
INSERT INTO "Label" ("id", "name", "color") VALUES
('label-frontend', 'frontend', '#3b82f6'),
('label-backend', 'backend', '#10b981'),
('label-design', 'design', '#f59e0b'),
('label-legal', 'legal', '#8b5cf6'),
('label-urgent', 'urgent', '#ef4444'),
('label-docs', 'documentation', '#6366f1'),
('label-research', 'research', '#14b8a6');

-- 4. Insert Projects
INSERT INTO "Project" ("id", "name", "description", "status", "createdAt", "updatedAt") VALUES
('proj-website', 'Website Redesign', 'Redesign the company website with improved UI/UX and mobile responsiveness', 'ACTIVE', NOW(), NOW()),
('proj-portal', 'Client Portal Development', 'Build a secure client-facing portal for case tracking and document sharing', 'ACTIVE', NOW(), NOW()),
('proj-app', 'Mobile App Launch', 'Finalize and launch the mobile application for iOS and Android platforms', 'ACTIVE', NOW(), NOW());

-- 5. Insert Project Members
INSERT INTO "ProjectMember" ("id", "projectId", "userId", "role") VALUES
('pm-1', 'proj-website', 'user-john-id', 'owner'),
('pm-2', 'proj-website', 'user-jane-id', 'member'),
('pm-3', 'proj-website', 'user-alex-id', 'member'),
('pm-4', 'proj-website', 'user-mike-id', 'member'),

('pm-5', 'proj-portal', 'user-john-id', 'owner'),
('pm-6', 'proj-portal', 'user-jane-id', 'member'),
('pm-7', 'proj-portal', 'user-sarah-id', 'member'),

('pm-8', 'proj-app', 'user-john-id', 'owner'),
('pm-9', 'proj-app', 'user-alex-id', 'member'),
('pm-10', 'proj-app', 'user-mike-id', 'member');


-- 6. Insert Boards
INSERT INTO "Board" ("id", "title", "projectId") VALUES
('board-website', 'Website Redesign Board', 'proj-website'),
('board-portal', 'Client Portal Board', 'proj-portal'),
('board-app', 'Mobile App Board', 'proj-app');

-- 7. Insert Columns
-- Website Redesign Board Columns
INSERT INTO "Column" ("id", "title", "position", "color", "boardId") VALUES
('col-web-todo', 'To Do', 0, '#6366f1', 'board-website'),
('col-web-prog', 'In Progress', 1, '#f59e0b', 'board-website'),
('col-web-review', 'Review', 2, '#8b5cf6', 'board-website'),
('col-web-done', 'Done', 3, '#10b981', 'board-website'),

-- Client Portal Board Columns
('col-port-backlog', 'Backlog', 0, '#94a3b8', 'board-portal'),
('col-port-todo', 'To Do', 1, '#6366f1', 'board-portal'),
('col-port-prog', 'In Progress', 2, '#f59e0b', 'board-portal'),
('col-port-done', 'Done', 3, '#10b981', 'board-portal'),

-- Mobile App Board Columns
('col-app-todo', 'To Do', 0, '#6366f1', 'board-app'),
('col-app-prog', 'In Progress', 1, '#f59e0b', 'board-app'),
('col-app-qa', 'QA Testing', 2, '#ec4899', 'board-app'),
('col-app-done', 'Done', 3, '#10b981', 'board-app');

-- 8. Insert Tickets
-- Project 1 (Website) Tickets
INSERT INTO "Ticket" ("id", "title", "description", "type", "priority", "dueDate", "position", "columnId", "assigneeId", "creatorId", "createdAt", "updatedAt") VALUES
('tick-1', 'Implement user authentication', 'Set up user authentication using NextAuth.js with email/password and Google OAuth options.', 'FEATURE', 'HIGH', '2026-03-15', 0, 'col-web-todo', 'user-jane-id', 'user-john-id', NOW(), NOW()),
('tick-2', 'Design landing page mockups', 'Create mockups for the new landing page focusing on conversion and user engagement.', 'TASK', 'MEDIUM', '2026-03-10', 1, 'col-web-todo', 'user-alex-id', 'user-john-id', NOW(), NOW()),
('tick-3', 'Research AI integration options', 'Evaluate AI/ML frameworks for document analysis and intelligent search features.', 'RESEARCH', 'LOW', '2026-03-20', 2, 'col-web-todo', 'user-sarah-id', 'user-john-id', NOW(), NOW()),
('tick-4', 'Fix responsive layout issues', 'Address the layout issues on mobile devices, particularly on the dashboard and kanban board.', 'BUG', 'HIGH', '2026-03-08', 0, 'col-web-prog', 'user-mike-id', 'user-john-id', NOW(), NOW()),
('tick-5', 'Implement drag-and-drop functionality', 'Add drag-and-drop functionality to the Kanban board using React DnD.', 'FEATURE', 'MEDIUM', '2026-03-12', 1, 'col-web-prog', 'user-jane-id', 'user-john-id', NOW(), NOW()),
('tick-6', 'Optimize database queries', 'Review and optimize the current database queries to improve application performance.', 'TASK', 'MEDIUM', '2026-03-09', 0, 'col-web-review', 'user-mike-id', 'user-john-id', NOW(), NOW()),
('tick-7', 'Set up CI/CD pipeline', 'Configure GitHub Actions for continuous integration and deployment to Vercel.', 'TASK', 'HIGH', '2026-02-28', 0, 'col-web-done', 'user-jane-id', 'user-john-id', NOW(), NOW()),
('tick-8', 'Create user onboarding flow', 'Design and implement the user onboarding flow to improve new user experience.', 'FEATURE', 'MEDIUM', '2026-03-03', 1, 'col-web-done', 'user-alex-id', 'user-john-id', NOW(), NOW());

-- Project 2 (Portal) Tickets
INSERT INTO "Ticket" ("id", "title", "description", "type", "priority", "dueDate", "position", "columnId", "assigneeId", "creatorId", "createdAt", "updatedAt") VALUES
('tick-9', 'Design client dashboard wireframes', 'Create wireframes for the client-facing dashboard showing case progress.', 'TASK', 'HIGH', '2026-03-05', 0, 'col-port-todo', 'user-alex-id', 'user-john-id', NOW(), NOW()),
('tick-10', 'Implement document upload & sharing', 'Build secure file upload and sharing system for legal documents with access controls.', 'FEATURE', 'HIGH', '2026-03-18', 0, 'col-port-prog', 'user-jane-id', 'user-john-id', NOW(), NOW()),
('tick-11', 'Set up client notification system', 'Implement email and in-app notifications for case updates sent to clients.', 'FEATURE', 'MEDIUM', '2026-03-22', 0, 'col-port-backlog', 'user-mike-id', 'user-john-id', NOW(), NOW());

-- Project 3 (App) Tickets
INSERT INTO "Ticket" ("id", "title", "description", "type", "priority", "dueDate", "position", "columnId", "assigneeId", "creatorId", "createdAt", "updatedAt") VALUES
('tick-12', 'iOS app store submission', 'Prepare and submit the iOS application to the Apple App Store.', 'TASK', 'URGENT', '2026-03-01', 0, 'col-app-todo', 'user-mike-id', 'user-john-id', NOW(), NOW()),
('tick-13', 'Android push notifications', 'Implement push notification system for the Android app using Firebase.', 'FEATURE', 'HIGH', '2026-03-10', 0, 'col-app-prog', 'user-mike-id', 'user-john-id', NOW(), NOW());


-- 9. Insert TicketLabels (Many-to-Many)
INSERT INTO "TicketLabel" ("ticketId", "labelId") VALUES
('tick-1', 'label-backend'),
('tick-2', 'label-design'),
('tick-3', 'label-research'),
('tick-4', 'label-frontend'),
('tick-5', 'label-frontend'),
('tick-6', 'label-backend'),
('tick-7', 'label-backend'),
('tick-8', 'label-design'),
('tick-9', 'label-design'),
('tick-9', 'label-legal'),
('tick-10', 'label-backend'),
('tick-10', 'label-legal'),
('tick-11', 'label-backend');

-- 10. Insert Meetings
INSERT INTO "Meeting" ("id", "title", "description", "startTime", "endTime", "meetLink", "organizerId", "createdAt", "updatedAt") VALUES
('meet-1', 'Weekly Team Standup', 'Review progress on active projects and discuss blockers', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 30 minutes', 'https://meet.google.com/abc-defg-hij', 'user-john-id', NOW(), NOW()),
('meet-2', 'Website Redesign Planning', 'Discuss new design mockups and finalize the landing page approach', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 1 hour', 'https://meet.google.com/klm-nopq-rst', 'user-alex-id', NOW(), NOW()),
('meet-3', 'Client Portal Review', 'Review client portal progress and demo current features', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 1 hour', 'https://meet.google.com/uvw-xyz-123', 'user-john-id', NOW(), NOW());

-- 11. Insert Meeting Attendees (Implicit m-n table "_MeetingAttendees")
-- Note: Prisma uses implicit tables for m-n relations. The table name is usually "_MeetingAttendees" with columns "A" (Meeting ID) and "B" (User ID).
INSERT INTO "_MeetingAttendees" ("A", "B") VALUES
('meet-1', 'user-john-id'), ('meet-1', 'user-jane-id'), ('meet-1', 'user-alex-id'), ('meet-1', 'user-sarah-id'), ('meet-1', 'user-mike-id'),
('meet-2', 'user-john-id'), ('meet-2', 'user-jane-id'), ('meet-2', 'user-alex-id'),
('meet-3', 'user-jane-id'), ('meet-3', 'user-sarah-id'), ('meet-3', 'user-mike-id');

-- 12. Insert Knowledge Articles
INSERT INTO "KnowledgeArticle" ("id", "title", "content", "category", "tags", "views", "authorId", "createdAt", "updatedAt") VALUES
('art-1', 'Getting Started with Kanban Methodology', '# Getting Started with Kanban...', 'Methodology', ARRAY['kanban', 'agile', 'workflow'], 127, 'user-john-id', NOW(), NOW()),
('art-2', 'Best Practices for Legal Document Management', '# Legal Document Management...', 'Documentation', ARRAY['legal', 'document-management'], 89, 'user-sarah-id', NOW(), NOW()),
('art-3', 'Using AI for Case Research', '# AI-Powered Case Research...', 'Technology', ARRAY['ai', 'research', 'legal-tech'], 214, 'user-sarah-id', NOW(), NOW()),
('art-4', 'API Integration Guide for Cengineers Platform', '# API Integration Guide...', 'Technology', ARRAY['api', 'integration', 'developer'], 56, 'user-jane-id', NOW(), NOW());

-- 13. Insert Activity Logs
INSERT INTO "ActivityLog" ("id", "action", "entity", "entityId", "details", "userId", "projectId", "createdAt") VALUES
('log-1', 'created', 'project', 'proj-website', 'Created project "Website Redesign"', 'user-john-id', 'proj-website', NOW()),
('log-2', 'assigned', 'ticket', 'tick-1', 'Assigned "Implement user authentication" to Jane Smith', 'user-john-id', 'proj-website', NOW()),
('log-3', 'completed', 'ticket', 'tick-7', 'Completed "Set up CI/CD pipeline"', 'user-jane-id', 'proj-website', NOW());

-- 14. Insert Notifications
INSERT INTO "Notification" ("id", "type", "title", "message", "linkTo", "userId", "createdAt") VALUES
('notif-1', 'ticket_assigned', 'Ticket Assigned', 'You have been assigned "Implement user authentication"', '/projects/proj-website', 'user-jane-id', NOW()),
('notif-2', 'meeting_scheduled', 'New Meeting', 'John Doe scheduled "Weekly Team Standup"', '/meetings', 'user-jane-id', NOW()),
('notif-3', 'project_created', 'New Project', 'You''ve been added to "Client Portal Development"', '/projects/proj-portal', 'user-sarah-id', NOW());
