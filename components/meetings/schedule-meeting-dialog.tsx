"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, Loader2, Video, Link2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface DBUser {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
}

interface ScheduleMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMeetingSchedule?: (meeting: any) => void
}

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  onMeetingSchedule,
}: ScheduleMeetingDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [meetLink, setMeetLink] = useState("")
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([])
  const [externalEmails, setExternalEmails] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<DBUser[]>([])
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (open && users.length === 0) {
      fetch("/api/users", {
        credentials: 'include',
      })
        .then(r => r.json())
        .then(data => setUsers(data.users || []))
        .catch(() => { })
    }
  }, [open, isAuthenticated, users.length])

  const reset = () => {
    setTitle("")
    setDescription("")
    setDate("")
    setStartTime("")
    setMeetLink("")
    setSelectedAttendeeIds([])
    setExternalEmails("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !startTime) return
    setIsLoading(true)

    try {
      const startDateObj = new Date(`${date}T${startTime}`)
      const startDateTime = startDateObj.toISOString()
      const endDateTime = new Date(startDateObj.getTime() + 60 * 60 * 1000).toISOString()

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          startTime: startDateTime,
          endTime: endDateTime,
          meetLink: meetLink.trim() || undefined,
          attendeeIds: selectedAttendeeIds,
          externalAttendees: externalEmails.split(',').map(e => e.trim()).filter(e => e),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to schedule meeting")

      toast.success("Meeting scheduled!", {
        description: selectedAttendeeIds.length > 0
          ? `Inviting ${selectedAttendeeIds.length} attendee(s)`
          : "Meeting created successfully",
      })

      if (onMeetingSchedule) {
        onMeetingSchedule(data.meeting)
      }

      reset()
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Failed to schedule meeting", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstantMeeting = async () => {
    setIsLoading(true)
    try {
      const startDateTime = new Date()
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: `Instant Meeting - ${user?.name || 'Team'}`,
          description: "Instant meeting",
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          attendeeIds: selectedAttendeeIds,
          externalAttendees: externalEmails.split(',').map(e => e.trim()).filter(e => e),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create meeting")

      toast.success("Instant Meeting created!", {
        description: selectedAttendeeIds.length > 0
          ? `Inviting ${selectedAttendeeIds.length} attendee(s)`
          : "Meeting created successfully",
      })

      if (onMeetingSchedule) {
        onMeetingSchedule(data.meeting)
      }

      reset()
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Failed to create instant meeting", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAttendee = (id: string) => {
    setSelectedAttendeeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Filter out current user from attendees list (they are auto-organizer)
  const filteredUsers = users.filter(u => u.id !== user?.id)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30">
                <Video className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              Schedule Meeting
            </DialogTitle>
            <DialogDescription>
              Create a meeting and invite your team members.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Meeting Title <span className="text-destructive">*</span></Label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly Team Standup"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="meeting-desc">Description</Label>
              <Textarea
                id="meeting-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Discuss progress on active projects..."
                rows={2}
              />
            </div>

            {/* Date & Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Date <span className="text-destructive">*</span></Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-start">Start <span className="text-destructive">*</span></Label>
                <Input
                  id="meeting-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Meeting link */}
            <div className="space-y-2">
              <Label htmlFor="meet-link">
                <span className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />
                  Meeting Link (leave blank to auto-generate)
                </span>
              </Label>
              <Input
                id="meet-link"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
            </div>

            {/* Attendees */}
            <div className="space-y-2">
              <Label>Invite Attendees</Label>
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading team members...</p>
              ) : (
                <div className="max-h-44 overflow-y-auto border rounded-md p-2 space-y-1">
                  {filteredUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-muted rounded-md px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={selectedAttendeeIds.includes(u.id)}
                        onChange={() => toggleAttendee(u.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{u.role.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedAttendeeIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedAttendeeIds.length} attendee(s) selected
                </p>
              )}
            </div>

            {/* External Attendees */}
            <div className="space-y-2">
              <Label htmlFor="external-emails">External Attendees (comma-separated emails)</Label>
              <Textarea
                id="external-emails"
                value={externalEmails}
                onChange={(e) => setExternalEmails(e.target.value)}
                placeholder="guest1@example.com, guest2@example.com"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 sm:space-x-0">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
              Cancel
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                onClick={handleInstantMeeting}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}
                Instant Meet
              </Button>
              <Button
                type="submit"
                className="flex-1 sm:flex-none bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
                disabled={isLoading || !title.trim() || !date || !startTime}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarDays className="mr-2 h-4 w-4" />}
                Schedule
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
