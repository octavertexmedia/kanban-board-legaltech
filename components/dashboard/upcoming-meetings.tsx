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
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setMeetings((data.meetings || []).slice(0, 3)))
      .catch(() => { })
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  return (
    <Card className="border-0 shadow-xl shadow-black/5 ring-1 ring-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
            <CalendarDays className="h-4 w-4" />
          </div>
          Upcoming Meetings
        </CardTitle>
        <Link href="/meetings">
          <Button variant="ghost" size="sm" className="gap-1 hover:bg-violet-500/10 hover:text-violet-600 transition-colors">
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl opacity-50">📅</span>
            </div>
            <p className="font-medium text-foreground">No upcoming meetings</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Your schedule is clear</p>
            <Link href="/meetings">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 transition-all">Schedule Meeting</Button>
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
                <div key={meeting.id} className="group relative bg-card hover:bg-muted/40 border border-border/50 flex flex-col gap-3 p-3.5 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="font-semibold text-sm truncate group-hover:text-violet-600 transition-colors">{meeting.title}</div>
                      <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 text-[10px] px-2 py-0 h-5 font-semibold">
                        {dateLabel} · {timeLabel} – {endLabel}
                      </Badge>
                    </div>
                    {meeting.meetLink && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className="bg-muted/50 text-muted-foreground border-border/50 gap-1 cursor-pointer hover:bg-muted text-[10px] shadow-sm transition-colors py-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(meeting.meetLink!)
                            toast.success("Meeting link copied to clipboard")
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Badge>
                        <a
                          href={meeting.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                        >
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1 cursor-pointer hover:bg-blue-500/20 text-[10px] shadow-sm transition-colors py-1 font-semibold">
                            <Video className="h-3 w-3" />
                            Join
                          </Badge>
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border/20 shadow-sm transition-transform group-hover:scale-110">
                        <AvatarImage src={meeting.organizer.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[9px] font-bold">{meeting.organizer.name[0]}</AvatarFallback>
                      </Avatar>
                      {meeting.attendees.slice(0, 2).map(a => (
                        <Avatar key={a.id} className="h-6 w-6 border-2 border-background ring-1 ring-border/20 shadow-sm transition-transform group-hover:scale-110">
                          <AvatarImage src={a.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[9px] font-bold">{a.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground ml-1">
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
