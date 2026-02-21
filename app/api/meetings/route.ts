import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getAuthFromRequest } from '@/lib/api-middleware'
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
)

if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

// GET /api/meetings
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const date = searchParams.get('date')
        const upcoming = searchParams.get('upcoming')

        const where: any = {}

        if (date) {
            const d = new Date(date)
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
            const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
            where.startTime = { gte: start, lt: end }
        } else if (upcoming === 'true') {
            where.startTime = { gte: new Date() }
        }

        const meetings = await prisma.meeting.findMany({
            where,
            include: {
                organizer: { select: { id: true, name: true, email: true, avatar: true } },
                attendees: { select: { id: true, name: true, email: true, avatar: true } },
            },
            orderBy: { startTime: 'asc' },
            take: 50,
        })

        return NextResponse.json({ meetings })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/meetings
export async function POST(req: NextRequest) {
    try {
        const auth = getAuthFromRequest(req)
        const body = await req.json()

        const { title, description, startTime, endTime, meetLink, attendeeIds, externalAttendees } = body

        if (!title || !startTime || !endTime) {
            return NextResponse.json(
                { error: 'Title, startTime, and endTime are required' },
                { status: 400 }
            )
        }

        let finalMeetLink = meetLink

        // Gather all attendees for Google Calendar invitation
        let allAttendeeEmails: { email: string }[] = []
        if (attendeeIds?.length) {
            const internalUsers = await prisma.user.findMany({
                where: { id: { in: attendeeIds } },
                select: { email: true }
            })
            allAttendeeEmails = internalUsers.map(u => ({ email: u.email }))
        }
        if (externalAttendees?.length) {
            externalAttendees.forEach((email: string) => {
                if (email) allAttendeeEmails.push({ email })
            })
        }

        if (!finalMeetLink && process.env.GOOGLE_REFRESH_TOKEN) {
            try {
                const event = await calendar.events.insert({
                    calendarId: 'primary',
                    conferenceDataVersion: 1,
                    sendUpdates: 'all',
                    requestBody: {
                        summary: title,
                        description: description || '',
                        start: { dateTime: new Date(startTime).toISOString() },
                        end: { dateTime: new Date(endTime).toISOString() },
                        attendees: allAttendeeEmails,
                        conferenceData: {
                            createRequest: {
                                requestId: `meet-${Date.now()}`,
                                conferenceSolutionKey: { type: 'hangoutsMeet' }
                            }
                        }
                    }
                })

                finalMeetLink = event.data.hangoutLink || event.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;
            } catch (err: any) {
                console.error("Google Calendar API Error:", err.message)
                // Proceed with fallback random link if API fails
            }
        }

        finalMeetLink = finalMeetLink || `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`

        const meeting = await prisma.meeting.create({
            data: {
                title,
                description: description || '',
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                meetLink: finalMeetLink,
                externalAttendees: externalAttendees || [],
                organizerId: auth?.userId || '',
                attendees: attendeeIds?.length
                    ? { connect: attendeeIds.map((id: string) => ({ id })) }
                    : undefined,
            },
            include: {
                organizer: { select: { id: true, name: true, email: true, avatar: true } },
                attendees: { select: { id: true, name: true, email: true, avatar: true } },
            },
        })

        if (auth) {
            await prisma.activityLog.create({
                data: {
                    action: 'scheduled',
                    entity: 'meeting',
                    entityId: meeting.id,
                    details: `Scheduled meeting "${title}"`,
                    userId: auth.userId,
                },
            })
        }

        return NextResponse.json({ meeting }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
