"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, Loader2, RefreshCw, MessageSquare, Activity, Info, UserCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface DBUser {
  id: string
  name: string
  email?: string
  role?: string
  avatar: string | null
}

interface DBComment {
  id: string
  text: string
  createdAt: string
  user: DBUser
}

interface DBActivity {
  id: string
  action: string
  details: string | null
  createdAt: string
  user: { id: string; name: string; avatar: string | null }
}

interface DBTicket {
  id: string
  title: string
  description: string | null
  type: string
  priority: string
  dueDate: string | null
  position: number
  columnId: string
  assignee: DBUser | null
  creator: DBUser | null
  labels: Array<{ label: { id: string; name: string; color: string } }>
  _count: { comments: number; attachments: number }
}

interface TicketDetailsDialogProps {
  ticket: DBTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTicketUpdated?: (ticket: DBTicket) => void
}

const getPriorityColor = (p: string) => {
  switch (p.toUpperCase()) {
    case "HIGH": return "bg-red-100 text-red-800 border-red-200"
    case "URGENT": return "bg-rose-100 text-rose-800 border-rose-200"
    case "MEDIUM": return "bg-amber-100 text-amber-800 border-amber-200"
    case "LOW": return "bg-emerald-100 text-emerald-800 border-emerald-200"
    default: return "bg-gray-100 text-gray-800"
  }
}

const getTypeColor = (t: string) => {
  switch (t.toUpperCase()) {
    case "BUG": return "bg-red-100 text-red-800"
    case "FEATURE": return "bg-blue-100 text-blue-800"
    case "TASK": return "bg-violet-100 text-violet-800"
    case "RESEARCH": return "bg-amber-100 text-amber-800"
    case "LEGAL_REVIEW": return "bg-purple-100 text-purple-800"
    case "CLIENT_INTAKE": return "bg-teal-100 text-teal-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export function TicketDetailsDialog({
  ticket,
  open,
  onOpenChange,
  onTicketUpdated,
}: TicketDetailsDialogProps) {
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState<DBComment[]>([])
  const [activities, setActivities] = useState<DBActivity[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [users, setUsers] = useState<DBUser[]>([])
  const [assigneeId, setAssigneeId] = useState(ticket?.assignee?.id || "")
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false)
  const { token, user } = useAuth()

  const authHeaders = (): HeadersInit => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const NONE = "__none__"

  // Load comments & activity when ticket changes
  useEffect(() => {
    if (!ticket || !open) return
    setAssigneeId(ticket.assignee?.id || "")
    loadTicketDetails()
    loadUsers()
  }, [ticket?.id, open])

  const loadTicketDetails = async () => {
    if (!ticket) return
    setIsLoadingComments(true)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (res.ok) {
        setComments(data.ticket.comments || [])
        setActivities(data.ticket.activities || [])
      }
    } catch {
      /* silent */
    } finally {
      setIsLoadingComments(false)
    }
  }

  const loadUsers = async () => {
    if (users.length > 0) return
    try {
      const res = await fetch("/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      /* silent */
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !ticket) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text: commentText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to post comment")

      setComments(prev => [data.comment, ...prev])
      setCommentText("")
      toast.success("Comment posted!")
    } catch (err: any) {
      toast.error("Failed to post comment", { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!ticket) return
    const resolved = newAssigneeId === NONE ? "" : newAssigneeId
    setAssigneeId(resolved)
    setIsUpdatingAssignee(true)
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ assigneeId: resolved || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Assignee updated!")
      if (onTicketUpdated) {
        onTicketUpdated(data.ticket)
      }
    } catch (err: any) {
      toast.error("Failed to update assignee", { description: err.message })
      setAssigneeId(ticket.assignee?.id || "")
    } finally {
      setIsUpdatingAssignee(false)
    }
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[740px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={`${getTypeColor(ticket.type)} text-xs`} variant="secondary">
              {ticket.type.replace("_", " ")}
            </Badge>
            <Badge className={`${getPriorityColor(ticket.priority)} text-xs border`} variant="secondary">
              {ticket.priority}
            </Badge>
          </div>
          <DialogTitle className="text-xl leading-tight">{ticket.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" /> Details
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Activity
            </TabsTrigger>
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-5 pt-4">
            {ticket.description && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                <p className="text-sm leading-relaxed">{ticket.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              {/* Assignee — editable */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Assignee</h3>
                <Select value={assigneeId} onValueChange={handleAssigneeChange} disabled={isUpdatingAssignee}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Unassigned">
                      {(() => {
                        const u = users.find(u => u.id === assigneeId) || ticket.assignee
                        return u ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={u.avatar || undefined} />
                              <AvatarFallback className="text-[9px]">{u.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{u.name}</span>
                            {isUpdatingAssignee && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <UserCheck className="h-4 w-4" /> Unassigned
                          </div>
                        )
                      })()}
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
                          <span className="text-xs text-muted-foreground capitalize">{u.role?.toLowerCase()}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Due Date</h3>
                <p className="text-sm">
                  {ticket.dueDate
                    ? new Date(ticket.dueDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                    : <span className="text-muted-foreground">No due date</span>
                  }
                </p>
              </div>

              {/* Creator */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Created By</h3>
                {ticket.creator ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={ticket.creator.avatar || undefined} />
                      <AvatarFallback className="text-[10px]">{ticket.creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{ticket.creator.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unknown</span>
                )}
              </div>

              {/* Labels */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Labels</h3>
                {ticket.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {ticket.labels.map(l => (
                      <Badge
                        key={l.label.id}
                        variant="secondary"
                        className="text-xs"
                        style={{ background: l.label.color + "22", color: l.label.color, borderColor: l.label.color + "44" }}
                      >
                        {l.label.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No labels</span>
                )}
              </div>
            </div>
          </TabsContent>

          {/* COMMENTS TAB */}
          <TabsContent value="comments" className="pt-4 space-y-4">
            {/* New comment input */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-bold">
                  {user?.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSubmitComment()
                    }
                  }}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">⌘+Enter to submit</p>
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || isSubmitting}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Comments list */}
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={comment.user.avatar || undefined} alt={comment.user.name} />
                      <AvatarFallback className="text-xs">{comment.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{comment.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm leading-relaxed">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value="activity" className="pt-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Recent activity for this ticket</p>
              <Button variant="ghost" size="sm" onClick={loadTicketDetails} className="h-7 gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {/* Creation event */}
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">
                  <span className="text-xs font-bold">C</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Ticket created</span>
                    <span className="text-xs text-muted-foreground">
                      {ticket.creator?.name || "Unknown"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Ticket was created</p>
                </div>
              </div>

              {ticket.assignee && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                    <span className="text-xs font-bold">A</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Assigned</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Assigned to {ticket.assignee.name}</p>
                  </div>
                </div>
              )}

              {activities.map((act) => (
                <div key={act.id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                    <span className="text-xs font-bold">{act.action[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">{act.action}</span>
                      <span className="text-xs text-muted-foreground">by {act.user.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(act.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {act.details && <p className="text-xs text-muted-foreground">{act.details}</p>}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
