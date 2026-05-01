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
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetch("/api/meetings?upcoming=true", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setMeetings((data.meetings || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-3 space-y-0">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          Upcoming meetings
        </CardTitle>
        <Link href="/meetings">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-0.5 text-muted-foreground hover:text-foreground">
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs font-medium text-foreground">No upcoming meetings</p>
            <p className="text-[11px] text-muted-foreground mt-1 mb-3">Your schedule is clear</p>
            <Link href="/meetings">
              <Button size="sm" variant="outline" className="h-7 text-xs">
                Schedule
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {meetings.map((meeting) => {
              const meetingDate = new Date(meeting.startTime)
              const endDate = new Date(meeting.endTime)
              let dateLabel = format(meetingDate, "MMM d")
              if (isToday(meetingDate)) dateLabel = "Today"
              else if (isTomorrow(meetingDate)) dateLabel = "Tomorrow"
              const timeLabel = format(meetingDate, "h:mm a")
              const endLabel = format(endDate, "h:mm a")

              return (
                <div
                  key={meeting.id}
                  className="rounded border border-border bg-background px-2.5 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-medium truncate">{meeting.title}</div>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal text-muted-foreground">
                        {dateLabel} · {timeLabel} – {endLabel}
                      </Badge>
                    </div>
                    {meeting.meetLink ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            void navigator.clipboard.writeText(meeting.meetLink!)
                            toast.success("Link copied")
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] gap-1" asChild>
                          <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer">
                            <Video className="h-3 w-3" />
                            Join
                          </a>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex -space-x-1">
                      <Avatar className="h-5 w-5 border border-background">
                        <AvatarImage src={meeting.organizer.avatar || undefined} />
                        <AvatarFallback className="text-[8px]">{meeting.organizer.name[0]}</AvatarFallback>
                      </Avatar>
                      {meeting.attendees.slice(0, 2).map((a) => (
                        <Avatar key={a.id} className="h-5 w-5 border border-background">
                          <AvatarImage src={a.avatar || undefined} />
                          <AvatarFallback className="text-[8px]">{a.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
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
