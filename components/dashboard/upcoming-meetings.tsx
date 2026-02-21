"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Video, ArrowRight, CalendarDays, Copy } from "lucide-react"
import { isToday, isTomorrow, format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface DBMeeting {
  id: string
  title: string
  startTime: string
  endTime: string
  meetLink: string | null
  organizer: { id: string; name: string; avatar: string | null }
  attendees: Array<{ id: string; name: string; avatar: string | null }>
}

export function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<DBMeeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetch("/api/meetings?upcoming=true", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => setMeetings((data.meetings || []).slice(0, 3)))
      .catch(() => { })
      .finally(() => setIsLoading(false))
  }, [token])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Upcoming Meetings</CardTitle>
        <Link href="/meetings">
          <Button variant="ghost" size="sm" className="gap-1">
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-6">
            <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming meetings</p>
            <Link href="/meetings">
              <Button variant="outline" size="sm" className="mt-2">Schedule Meeting</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const meetingDate = new Date(meeting.startTime)
              const endDate = new Date(meeting.endTime)
              let dateLabel = format(meetingDate, "MMM d")
              if (isToday(meetingDate)) dateLabel = "Today"
              else if (isTomorrow(meetingDate)) dateLabel = "Tomorrow"
              const timeLabel = format(meetingDate, "h:mm a")
              const endLabel = format(endDate, "h:mm a")

              return (
                <div key={meeting.id} className="flex flex-col gap-2.5 p-3 rounded-lg border hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-medium text-sm truncate">{meeting.title}</div>
                      <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 text-xs">
                        {dateLabel} · {timeLabel} – {endLabel}
                      </Badge>
                    </div>
                    {meeting.meetLink && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className="bg-muted text-muted-foreground border-border gap-1 cursor-pointer hover:bg-muted/80 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(meeting.meetLink!)
                            toast.success("Meeting link copied to clipboard")
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </Badge>
                        <a
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                        >
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 cursor-pointer hover:bg-blue-100 text-xs shadow-sm">
                            <Video className="h-3 w-3" />
                            Join
                          </Badge>
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      <Avatar className="h-5 w-5 border-2 border-background">
                        <AvatarImage src={meeting.organizer.avatar || undefined} />
                        <AvatarFallback className="text-[9px]">{meeting.organizer.name[0]}</AvatarFallback>
                      </Avatar>
                      {meeting.attendees.slice(0, 2).map(a => (
                        <Avatar key={a.id} className="h-5 w-5 border-2 border-background">
                          <AvatarImage src={a.avatar || undefined} />
                          <AvatarFallback className="text-[9px]">{a.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {meeting.attendees.length + 1} attendee{meeting.attendees.length + 1 !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
