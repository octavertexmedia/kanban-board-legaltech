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
  const [endTime, setEndTime] = useState("")
  const [meetLink, setMeetLink] = useState("")
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([])
  const [externalEmails, setExternalEmails] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<DBUser[]>([])
  const { token, user } = useAuth()

  useEffect(() => {
    if (open && users.length === 0) {
      fetch("/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(data => setUsers(data.users || []))
        .catch(() => { })
    }
  }, [open, token, users.length])

  const reset = () => {
    setTitle("")
    setDescription("")
    setDate("")
    setStartTime("")
    setEndTime("")
    setMeetLink("")
    setSelectedAttendeeIds([])
    setExternalEmails("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date || !startTime || !endTime) return
    setIsLoading(true)

    try {
      const startDateTime = new Date(`${date}T${startTime}`).toISOString()
      const endDateTime = new Date(`${date}T${endTime}`).toISOString()

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
            <div className="grid grid-cols-3 gap-3">
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
              <div className="space-y-2">
                <Label htmlFor="meeting-end">End <span className="text-destructive">*</span></Label>
                <Input
                  id="meeting-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
              disabled={isLoading || !title.trim() || !date || !startTime || !endTime}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
