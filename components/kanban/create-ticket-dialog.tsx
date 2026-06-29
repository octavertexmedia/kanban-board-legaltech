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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, UserCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface DBUser {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
}

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  columnId?: string
  sprintId?: string
  onTicketCreated?: (ticket: any) => void
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  projectId,
  columnId,
  sprintId,
  onTicketCreated,
}: CreateTicketDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("TASK")
  const [priority, setPriority] = useState("MEDIUM")
  const [dueDate, setDueDate] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<DBUser[]>([])
  const { isAuthenticated } = useAuth()

  // Fetch users when dialog opens
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

  const NONE = "__none__"

  const reset = () => {
    setTitle("")
    setDescription("")
    setType("TASK")
    setPriority("MEDIUM")
    setDueDate("")
    setAssigneeId(NONE)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    // If no columnId, we need one — skip silently
    if (!columnId) {
      toast.error("Please open a project board to create a ticket.")
      return
    }
    setIsLoading(true)

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          priority,
          dueDate: dueDate || undefined,
          columnId,
          assigneeId: (assigneeId === NONE || !assigneeId) ? undefined : assigneeId,
          sprintId: sprintId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create ticket")

      toast.success("Ticket created!", {
        description: `"${title}" added to To Do`,
      })

      if (onTicketCreated) {
        onTicketCreated(data.ticket)
      }

      reset()
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Failed to create ticket", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedUser = users.find(u => u.id === assigneeId)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>Fill in the details to create a new ticket for your team.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="ticket-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-desc">Description</Label>
              <Textarea
                id="ticket-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more context..."
                rows={3}
              />
            </div>

            {/* Type & Priority side-by-side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TASK">Task</SelectItem>
                    <SelectItem value="BUG">Bug</SelectItem>
                    <SelectItem value="FEATURE">Feature</SelectItem>
                    <SelectItem value="RESEARCH">Research</SelectItem>
                    <SelectItem value="LEGAL_REVIEW">Formal / stakeholder review</SelectItem>
                    <SelectItem value="CLIENT_INTAKE">Client Intake</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                    <SelectItem value="HIGH">🟠 High</SelectItem>
                    <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                    <SelectItem value="LOW">🟢 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-due">Due Date</Label>
              <Input
                id="ticket-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              {users.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading team...
                </div>
              ) : (
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned">
                      {selectedUser ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={selectedUser.avatar || undefined} />
                            <AvatarFallback className="text-[9px]">{selectedUser.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{selectedUser.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <UserCheck className="h-4 w-4" />
                          <span>Unassigned</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Unassigned</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={u.avatar || undefined} />
                            <AvatarFallback className="text-[9px]">{u.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{u.name}</span>
                          <span className="text-xs text-muted-foreground capitalize ml-1">{u.role.toLowerCase()}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Ticket"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
