"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Video, Users, Calendar as CalendarIcon, Loader2, RefreshCw, ExternalLink, Copy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface DBUser {
  id: string
  name: string
  email: string
  avatar: string | null
}

interface DBMeeting {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  meetLink: string | null
  organizer: DBUser
  attendees: DBUser[]
}

export function MeetingsCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [meetings, setMeetings] = useState<DBMeeting[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated } = useAuth()

  const fetchMeetingsForDate = useCallback(async (selectedDate: Date) => {
    setIsLoading(true)
    try {
      const dateStr = selectedDate.toISOString().split("T")[0]
      const res = await fetch(`/api/meetings?date=${dateStr}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load meetings")
      setMeetings(data.meetings || [])
    } catch (err: any) {
      toast.error("Failed to load meetings", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (date) fetchMeetingsForDate(date)
  }, [date, fetchMeetingsForDate])

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate)
  }

  const handleMeetingScheduled = (newMeeting: DBMeeting) => {
    // If the new meeting is on the selected date, add it
    if (date) {
      const meetDate = new Date(newMeeting.startTime)
      const isSameDay =
        meetDate.getDate() === date.getDate() &&
        meetDate.getMonth() === date.getMonth() &&
        meetDate.getFullYear() === date.getFullYear()
      if (isSameDay) {
        setMeetings(prev => [...prev, newMeeting].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ))
      }
    }
    toast.success("Meeting scheduled!", { description: `"${newMeeting.title}" has been added.` })
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Schedule and manage meetings with your team</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => date && fetchMeetingsForDate(date)}
            className="h-9 w-9"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => setIsScheduleOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Calendar picker */}
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md"
            />
            <div className="mt-4 pt-4 border-t space-y-1">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-primary" />
                {date
                  ? date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                  : "Select a date"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `${meetings.length} meeting${meetings.length !== 1 ? "s" : ""} scheduled`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Meeting list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {isLoading
              ? "Loading meetings..."
              : meetings.length > 0
                ? "Scheduled Meetings"
                : date
                  ? "No meetings scheduled for this day"
                  : "Select a date to view meetings"}
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No meetings on this day</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Schedule Meeting" to add one</p>
              <Button
                onClick={() => setIsScheduleOpen(true)}
                className="mt-4"
                variant="outline"
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          ) : (
            meetings.map((meeting) => (
              <Card key={meeting.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="grid grid-cols-[130px_1fr]">
                    {/* Time block */}
                    <div className="bg-gradient-to-b from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-4 flex flex-col justify-center items-center border-r">
                      <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                        {formatTime(meeting.startTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">to</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatTime(meeting.endTime)}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-base">{meeting.title}</h3>
                        {meeting.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {meeting.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {meeting.meetLink && (
                          <div className="flex items-center gap-2">
                            <a
                              href={meeting.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              onClick={e => e.stopPropagation()}
                            >
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 cursor-pointer hover:bg-blue-100">
                                <Video className="h-3 w-3" />
                                Join Meeting
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Badge>
                            </a>
                            <Badge
                              variant="outline"
                              className="bg-muted text-muted-foreground border-border gap-1 cursor-pointer hover:bg-muted/80"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(meeting.meetLink!)
                                toast.success("Meeting link copied to clipboard")
                              }}
                            >
                              <Copy className="h-3 w-3" />
                              Copy Link
                            </Badge>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="flex -space-x-1.5">
                            {[meeting.organizer, ...meeting.attendees].slice(0, 4).map((attendee) => (
                              <Avatar key={attendee.id} className="h-6 w-6 border-2 border-background" title={attendee.name}>
                                <AvatarImage src={attendee.avatar || undefined} alt={attendee.name} />
                                <AvatarFallback className="text-[9px]">{attendee.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ))}
                            {meeting.attendees.length + 1 > 4 && (
                              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-medium">
                                +{meeting.attendees.length + 1 - 4}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {meeting.attendees.length + 1} attendee{meeting.attendees.length + 1 !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <span className="text-xs text-muted-foreground ml-auto">
                          Organized by <strong>{meeting.organizer.name}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <ScheduleMeetingDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        onMeetingSchedule={handleMeetingScheduled}
      />
    </div>
  )
}
