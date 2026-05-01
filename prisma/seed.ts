import { createRequire } from 'node:module'

// Same env resolution as `scripts/prisma-with-env.cjs` (incl. Vercel-pulled Neon `kanban_*` URLs).
const require = createRequire(import.meta.url)
require('../scripts/load-database-env.cjs').loadDatabaseEnv()

import { randomBytes } from 'node:crypto'
import {
    PrismaClient,
    Role,
    UserStatus,
    ProjectStatus,
    TicketType,
    Priority,
    UserKind,
    ProjectMemberRole,
    StatusUpdateVisibility,
} from '@prisma/client'
import { hashPassword } from '../lib/authorization'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...\n')

    // ─── Clean existing data ─────────────────────────────
    await prisma.activityLog.deleteMany()
    await prisma.projectNote.deleteMany()
    await prisma.projectStatusUpdate.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.attachment.deleteMany()
    await prisma.ticketLabel.deleteMany()
    await prisma.ticket.deleteMany()
    await prisma.column.deleteMany()
    await prisma.board.deleteMany()
    await prisma.projectMember.deleteMany()
    await prisma.meeting.deleteMany()
    await prisma.knowledgeArticle.deleteMany()
    await prisma.label.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()

    // ─── Users ─────────────────────────────────────────────
    // `User.password` is required by Prisma but sign-in is Neon Auth only — use an
    // opaque placeholder (same idea as `ensureAppUserFromNeonSession`), not app passwords.
    const prismaPasswordPlaceholder = await hashPassword(
        randomBytes(32).toString('hex'),
    )

    const users = await Promise.all([
        prisma.user.create({
            data: {
                name: 'Admin User',
                email: 'admin@octavertexmedia.demo',
                password: prismaPasswordPlaceholder,
                role: Role.ADMIN,
                userKind: UserKind.INTERNAL,
                status: UserStatus.ACTIVE,
                avatar: '/avatars/admin.png',
            },
        }),
        prisma.user.create({
            data: {
                name: 'John Doe',
                email: 'john.doe@octavertexmedia.demo',
                password: prismaPasswordPlaceholder,
                role: Role.MANAGER,
                userKind: UserKind.INTERNAL,
                status: UserStatus.ACTIVE,
                avatar: '/avatars/john.png',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Jane Smith',
                email: 'jane.smith@octavertexmedia.demo',
                password: prismaPasswordPlaceholder,
                role: Role.ENGINEER,
                userKind: UserKind.INTERNAL,
                status: UserStatus.ACTIVE,
                avatar: '/avatars/jane.png',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Alex Johnson',
                email: 'alex.johnson@octavertexmedia.demo',
                password: prismaPasswordPlaceholder,
                role: Role.DESIGNER,
                userKind: UserKind.INTERNAL,
                status: UserStatus.ACTIVE,
                avatar: '/avatars/alex.png',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Sarah Williams',
                email: 'sarah.williams@octavertexmedia.demo',
                password: prismaPasswordPlaceholder,
                role: Role.RESEARCHER,
                userKind: UserKind.INTERNAL,
                status: UserStatus.INACTIVE,
                avatar: '/avatars/sarah.png',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Michael Brown',
                email: 'michael.brown@octavertexmedia.demo',
                password: prismaPasswordPlaceholder,
                role: Role.ENGINEER,
                userKind: UserKind.INTERNAL,
                status: UserStatus.ACTIVE,
                avatar: '/avatars/michael.png',
            },
        }),
        prisma.user.create({
            data: {
                name: 'Acme Corp Client',
                email: 'client@acmecorp.demo',
                password: prismaPasswordPlaceholder,
                role: Role.VIEWER,
                userKind: UserKind.CLIENT,
                status: UserStatus.ACTIVE,
                avatar: null,
            },
        }),
        prisma.user.create({
            data: {
                name: 'OctaVertex Media',
                email: 'octavertexmedia@gmail.com',
                password: prismaPasswordPlaceholder,
                role: Role.ADMIN,
                userKind: UserKind.INTERNAL,
                status: UserStatus.ACTIVE,
                avatar: null,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Manish Kumar',
                email: 'manish@octavertexmedia.com',
                password: prismaPasswordPlaceholder,
                role: Role.ADMIN,
                userKind: UserKind.INTERNAL,
                status: UserStatus.ACTIVE,
                avatar: null,
            },
        }),
    ])

    console.log(`✅ Created ${users.length} users`)

    // ─── Labels ──────────────────────────────────────────
    const labels = await Promise.all([
        prisma.label.create({ data: { name: 'frontend', color: '#3b82f6' } }),
        prisma.label.create({ data: { name: 'backend', color: '#10b981' } }),
        prisma.label.create({ data: { name: 'design', color: '#f59e0b' } }),
        prisma.label.create({ data: { name: 'compliance', color: '#8b5cf6' } }),
        prisma.label.create({ data: { name: 'urgent', color: '#ef4444' } }),
        prisma.label.create({ data: { name: 'documentation', color: '#6366f1' } }),
        prisma.label.create({ data: { name: 'research', color: '#14b8a6' } }),
    ])
    console.log(`✅ Created ${labels.length} labels`)

    // ─── Projects ────────────────────────────────────────
    const project1 = await prisma.project.create({
        data: {
            name: 'Website Redesign',
            description: 'Redesign the company website with improved UI/UX and mobile responsiveness',
            status: ProjectStatus.ACTIVE,
            members: {
                create: [
                    { userId: users[1].id, role: ProjectMemberRole.OWNER },
                    { userId: users[2].id, role: ProjectMemberRole.MEMBER },
                    { userId: users[3].id, role: ProjectMemberRole.MEMBER },
                    { userId: users[5].id, role: ProjectMemberRole.MEMBER },
                ],
            },
        },
    })

    const project2 = await prisma.project.create({
        data: {
            name: 'Client Portal Development',
            description: 'Build a secure client-facing portal for delivery status, files, and collaboration',
            status: ProjectStatus.ACTIVE,
            members: {
                create: [
                    { userId: users[1].id, role: ProjectMemberRole.OWNER },
                    { userId: users[2].id, role: ProjectMemberRole.MEMBER },
                    { userId: users[4].id, role: ProjectMemberRole.MEMBER },
                    { userId: users[6].id, role: ProjectMemberRole.CLIENT },
                ],
            },
        },
    })

    const project3 = await prisma.project.create({
        data: {
            name: 'Mobile App Launch',
            description: 'Finalize and launch the mobile application for iOS and Android platforms',
            status: ProjectStatus.ACTIVE,
            members: {
                create: [
                    { userId: users[1].id, role: ProjectMemberRole.OWNER },
                    { userId: users[3].id, role: ProjectMemberRole.MEMBER },
                    { userId: users[5].id, role: ProjectMemberRole.MEMBER },
                ],
            },
        },
    })
    console.log('✅ Created 3 projects')

    await prisma.projectStatusUpdate.createMany({
        data: [
            {
                projectId: project2.id,
                authorId: users[1].id,
                title: 'Sprint kickoff complete',
                body: 'Discovery workshop finished. Next: wireframes for the client dashboard and document upload flow.',
                visibility: StatusUpdateVisibility.CLIENT,
            },
            {
                projectId: project2.id,
                authorId: users[1].id,
                title: 'Internal: vendor shortlist',
                body: 'Evaluating two e-signature vendors — internal only until delivery lead approves sharing.',
                visibility: StatusUpdateVisibility.INTERNAL,
            },
            {
                projectId: project1.id,
                authorId: users[1].id,
                title: 'Design review scheduled',
                body: 'Stakeholder review moved to Thursday 3pm.',
                visibility: StatusUpdateVisibility.CLIENT,
            },
        ],
    })
    console.log('✅ Created project status updates')

    // ─── Boards & Columns ───────────────────────────────
    const board1 = await prisma.board.create({
        data: {
            title: 'Website Redesign Board',
            projectId: project1.id,
            columns: {
                create: [
                    { title: 'To Do', position: 0, color: '#6366f1' },
                    { title: 'In Progress', position: 1, color: '#f59e0b' },
                    { title: 'Review', position: 2, color: '#8b5cf6' },
                    { title: 'Done', position: 3, color: '#10b981' },
                ],
            },
        },
        include: { columns: true },
    })

    const board2 = await prisma.board.create({
        data: {
            title: 'Client Portal Board',
            projectId: project2.id,
            columns: {
                create: [
                    { title: 'Backlog', position: 0, color: '#94a3b8' },
                    { title: 'To Do', position: 1, color: '#6366f1' },
                    { title: 'In Progress', position: 2, color: '#f59e0b' },
                    { title: 'Done', position: 3, color: '#10b981' },
                ],
            },
        },
        include: { columns: true },
    })

    const board3 = await prisma.board.create({
        data: {
            title: 'Mobile App Board',
            projectId: project3.id,
            columns: {
                create: [
                    { title: 'To Do', position: 0, color: '#6366f1' },
                    { title: 'In Progress', position: 1, color: '#f59e0b' },
                    { title: 'QA Testing', position: 2, color: '#ec4899' },
                    { title: 'Done', position: 3, color: '#10b981' },
                ],
            },
        },
        include: { columns: true },
    })
    console.log('✅ Created 3 boards with columns')

    // ─── Tickets for Project 1 ──────────────────────────
    const ticketsP1 = await Promise.all([
        prisma.ticket.create({
            data: {
                title: 'Implement user authentication',
                description: 'Set up user authentication using NextAuth.js with email/password and Google OAuth options.',
                type: TicketType.FEATURE,
                priority: Priority.HIGH,
                dueDate: new Date('2026-03-15'),
                position: 0,
                columnId: board1.columns[0].id,
                assigneeId: users[2].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[1].id }] },
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Design landing page mockups',
                description: 'Create mockups for the new landing page focusing on conversion and user engagement.',
                type: TicketType.TASK,
                priority: Priority.MEDIUM,
                dueDate: new Date('2026-03-10'),
                position: 1,
                columnId: board1.columns[0].id,
                assigneeId: users[3].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[2].id }] },
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Research AI integration options',
                description: 'Evaluate AI/ML frameworks for document analysis and intelligent search features.',
                type: TicketType.RESEARCH,
                priority: Priority.LOW,
                dueDate: new Date('2026-03-20'),
                position: 2,
                columnId: board1.columns[0].id,
                assigneeId: users[4].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[6].id }] },
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Fix responsive layout issues',
                description: 'Address the layout issues on mobile devices, particularly on the dashboard and kanban board.',
                type: TicketType.BUG,
                priority: Priority.HIGH,
                dueDate: new Date('2026-03-08'),
                position: 0,
                columnId: board1.columns[1].id,
                assigneeId: users[5].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[0].id }] },
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Implement drag-and-drop functionality',
                description: 'Add drag-and-drop functionality to the Kanban board using React DnD.',
                type: TicketType.FEATURE,
                priority: Priority.MEDIUM,
                dueDate: new Date('2026-03-12'),
                position: 1,
                columnId: board1.columns[1].id,
                assigneeId: users[2].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[0].id }] },
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Optimize database queries',
                description: 'Review and optimize the current database queries to improve application performance.',
                type: TicketType.TASK,
                priority: Priority.MEDIUM,
                dueDate: new Date('2026-03-09'),
                position: 0,
                columnId: board1.columns[2].id,
                assigneeId: users[5].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[1].id }] },
                comments: {
                    create: [{
                        text: 'Found several N+1 query issues in the project list. Working on batch loading.',
                        userId: users[5].id,
                    }],
                },
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Set up CI/CD pipeline',
                description: 'Configure GitHub Actions for continuous integration and deployment to Vercel.',
                type: TicketType.TASK,
                priority: Priority.HIGH,
                dueDate: new Date('2026-02-28'),
                position: 0,
                columnId: board1.columns[3].id,
                assigneeId: users[2].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[1].id }] },
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Create user onboarding flow',
                description: 'Design and implement the user onboarding flow to improve new user experience.',
                type: TicketType.FEATURE,
                priority: Priority.MEDIUM,
                dueDate: new Date('2026-03-03'),
                position: 1,
                columnId: board1.columns[3].id,
                assigneeId: users[3].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[2].id }] },
            },
        }),
    ])

    // ─── Tickets for Project 2 ──────────────────────────
    const ticketsP2 = await Promise.all([
        prisma.ticket.create({
            data: {
                title: 'Design client dashboard wireframes',
                description: 'Create wireframes for the client-facing dashboard showing project progress.',
                type: TicketType.TASK,
                priority: Priority.HIGH,
                dueDate: new Date('2026-03-05'),
                position: 0,
                columnId: board2.columns[1].id,
                assigneeId: users[3].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[2].id }, { labelId: labels[3].id }] },
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Implement document upload & sharing',
                description: 'Build secure file upload and sharing with role-based access for client deliverables.',
                type: TicketType.FEATURE,
                priority: Priority.HIGH,
                dueDate: new Date('2026-03-18'),
                position: 0,
                columnId: board2.columns[2].id,
                assigneeId: users[2].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[1].id }, { labelId: labels[3].id }] },
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Set up client notification system',
                description: 'Implement email and in-app notifications for project updates sent to clients.',
                type: TicketType.FEATURE,
                priority: Priority.MEDIUM,
                dueDate: new Date('2026-03-22'),
                position: 0,
                columnId: board2.columns[0].id,
                assigneeId: users[5].id,
                creatorId: users[1].id,
                labels: { create: [{ labelId: labels[1].id }] },
            },
        }),
    ])

    // ─── Tickets for Project 3 ──────────────────────────
    await Promise.all([
        prisma.ticket.create({
            data: {
                title: 'iOS app store submission',
                description: 'Prepare and submit the iOS application to the Apple App Store.',
                type: TicketType.TASK,
                priority: Priority.URGENT,
                dueDate: new Date('2026-03-01'),
                position: 0,
                columnId: board3.columns[0].id,
                assigneeId: users[5].id,
                creatorId: users[1].id,
            },
        }),
        prisma.ticket.create({
            data: {
                title: 'Android push notifications',
                description: 'Implement push notification system for the Android app using Firebase.',
                type: TicketType.FEATURE,
                priority: Priority.HIGH,
                dueDate: new Date('2026-03-10'),
                position: 0,
                columnId: board3.columns[1].id,
                assigneeId: users[5].id,
                creatorId: users[1].id,
            },
        }),
    ])

    console.log(`✅ Created ${ticketsP1.length + ticketsP2.length + 2} tickets`)

    // ─── Meetings ────────────────────────────────────────
    const now = new Date()
    await Promise.all([
        prisma.meeting.create({
            data: {
                title: 'Weekly Team Standup',
                description: 'Review progress on active projects and discuss blockers',
                startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0),
                endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 30),
                meetLink: 'https://meet.google.com/abc-defg-hij',
                organizerId: users[1].id,
                attendees: { connect: users.slice(1).map(u => ({ id: u.id })) },
            },
        }),
        prisma.meeting.create({
            data: {
                title: 'Website Redesign Planning',
                description: 'Discuss new design mockups and finalize the landing page approach',
                startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 0),
                endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 15, 0),
                meetLink: 'https://meet.google.com/klm-nopq-rst',
                organizerId: users[3].id,
                attendees: { connect: [{ id: users[1].id }, { id: users[2].id }, { id: users[3].id }] },
            },
        }),
        prisma.meeting.create({
            data: {
                title: 'Client Portal Review',
                description: 'Review client portal progress and demo current features',
                startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 16, 0),
                endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 17, 0),
                meetLink: 'https://meet.google.com/uvw-xyz-123',
                organizerId: users[1].id,
                attendees: { connect: [{ id: users[2].id }, { id: users[4].id }, { id: users[5].id }] },
            },
        }),
    ])
    console.log('✅ Created 3 meetings')

    // ─── Knowledge Articles ──────────────────────────────
    await Promise.all([
        prisma.knowledgeArticle.create({
            data: {
                title: 'Getting Started with Kanban Methodology',
                content: `# Getting Started with Kanban\n\nKanban is a visual workflow management method that helps teams visualize work, limit work-in-progress, and maximize efficiency.\n\n## Key Principles\n\n1. **Visualize the workflow** — Use a board with columns representing each stage\n2. **Limit WIP** — Set limits on how many items can be in each stage\n3. **Manage flow** — Monitor and optimize the flow of work\n4. **Make policies explicit** — Define clear rules for each stage\n5. **Implement feedback loops** — Regular standups and reviews\n6. **Improve collaboratively** — Use data to drive continuous improvement\n\n## Benefits for software teams\n\n- See delivery flow end to end\n- Spot bottlenecks before deadlines slip\n- Align engineering, design, and stakeholders\n- Ship increments with predictable cadence`,
                category: 'Methodology',
                tags: ['kanban', 'agile', 'workflow', 'engineering'],
                views: 127,
                authorId: users[1].id,
            },
        }),
        prisma.knowledgeArticle.create({
            data: {
                title: 'Technical documentation standards',
                content: `# Technical documentation standards\n\nGood docs keep OctaVertex Media shipping fast.\n\n## Naming and structure\n\n- Use clear titles: purpose first, audience second\n- Prefer ADRs for significant technical decisions\n- Link to code, tickets, and designs from the doc\n\n## Version control\n\n- Store docs with the repo or in the knowledge base with owners\n- Review changes like code during critical releases\n\n## Security\n\n- Do not paste secrets into articles\n- Use role-based visibility for client-facing spaces`,
                category: 'Documentation',
                tags: ['engineering', 'documentation', 'best-practices'],
                views: 89,
                authorId: users[4].id,
            },
        }),
        prisma.knowledgeArticle.create({
            data: {
                title: 'Using AI in engineering workflows',
                content: `# AI-assisted engineering\n\nAI can speed up research, drafting, and review — with humans accountable for outcomes.\n\n## Practical uses\n\n- **Exploration** — summarize long threads or specs\n- **Test ideas** — generate cases to consider, then narrow manually\n- **Code context** — accelerate boilerplate; review every change\n\n## Guardrails\n\n1. No secrets or PII in prompts\n2. Verify outputs against source systems\n3. Keep audit-friendly notes for client-facing work`,
                category: 'Technology',
                tags: ['ai', 'engineering', 'productivity'],
                views: 214,
                authorId: users[4].id,
            },
        }),
        prisma.knowledgeArticle.create({
            data: {
                title: 'API integration guide for Vertex PM',
                content: `# API Integration Guide\n\n## Authentication\n\nAll API calls require a Bearer token:\n\n\`\`\`\nAuthorization: Bearer <your-token>\n\`\`\`\n\n## Endpoints\n\n- \`GET /api/tickets\` — List tickets\n- \`POST /api/tickets\` — Create ticket\n- \`PATCH /api/tickets/:id\` — Update ticket\n\n## Rate Limits\n\n- 100 requests per minute per user\n- 1000 requests per hour per user`,
                category: 'Technology',
                tags: ['api', 'integration', 'developer'],
                views: 56,
                authorId: users[2].id,
            },
        }),
    ])
    console.log('✅ Created 4 knowledge articles')

    // ─── Activity Logs ───────────────────────────────────
    await Promise.all([
        prisma.activityLog.create({
            data: {
                action: 'created',
                entity: 'project',
                entityId: project1.id,
                details: 'Created project "Website Redesign"',
                userId: users[1].id,
                projectId: project1.id,
            },
        }),
        prisma.activityLog.create({
            data: {
                action: 'assigned',
                entity: 'ticket',
                entityId: ticketsP1[0].id,
                details: 'Assigned "Implement user authentication" to Jane Smith',
                userId: users[1].id,
                projectId: project1.id,
            },
        }),
        prisma.activityLog.create({
            data: {
                action: 'completed',
                entity: 'ticket',
                entityId: ticketsP1[6].id,
                details: 'Completed "Set up CI/CD pipeline"',
                userId: users[2].id,
                projectId: project1.id,
            },
        }),
        prisma.activityLog.create({
            data: {
                action: 'scheduled',
                entity: 'meeting',
                entityId: 'meeting-1',
                details: 'Scheduled "Weekly Team Standup"',
                userId: users[1].id,
            },
        }),
    ])
    console.log('✅ Created activity logs')

    // ─── Notifications ───────────────────────────────────
    await Promise.all([
        prisma.notification.create({
            data: {
                type: 'ticket_assigned',
                title: 'Ticket Assigned',
                message: 'You have been assigned "Implement user authentication"',
                linkTo: `/projects/${project1.id}`,
                userId: users[2].id,
            },
        }),
        prisma.notification.create({
            data: {
                type: 'meeting_scheduled',
                title: 'New Meeting',
                message: 'John Doe scheduled "Weekly Team Standup"',
                linkTo: '/meetings',
                userId: users[2].id,
            },
        }),
        prisma.notification.create({
            data: {
                type: 'project_created',
                title: 'New Project',
                message: 'You\'ve been added to "Client Portal Development"',
                linkTo: `/projects/${project2.id}`,
                userId: users[4].id,
            },
        }),
    ])
    console.log('✅ Created notifications')

    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📋 Seeded users (Prisma roles — sign-in passwords are managed by Neon Auth, not printed here):')
    console.log('─────────────────────────────────────────')
    console.log('Admin:      admin@octavertexmedia.demo')
    console.log('Admin:      octavertexmedia@gmail.com')
    console.log('Admin:      manish@octavertexmedia.com')
    console.log('Manager:    john.doe@octavertexmedia.demo')
    console.log('Engineer:   jane.smith@octavertexmedia.demo')
    console.log('Designer:   alex.johnson@octavertexmedia.demo')
    console.log('Researcher: sarah.williams@octavertexmedia.demo')
    console.log('Engineer:   michael.brown@octavertexmedia.demo')
    console.log('Client:     client@acmecorp.demo  (Client Portal Development)')
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
