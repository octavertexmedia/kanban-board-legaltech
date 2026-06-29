"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Calendar, MessageSquare, Paperclip, RefreshCw, Loader2, Flag, Users, Filter } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { CreateTicketDialog } from "@/components/kanban/create-ticket-dialog"
import { TicketDetailsDialog } from "@/components/kanban/ticket-details-dialog"
import { SprintManagerDialog, type DBSprint } from "@/components/projects/sprint-manager-dialog"
import { stripMarkdown } from "@/lib/markdown-utils"

interface DBUser {
  id: string
  name: string
  email?: string
  role?: string
  avatar: string | null
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
  sprint?: { id: string; name: string; status: string } | null
  sprintId?: string | null
  labels: Array<{ label: { id: string; name: string; color: string } }>
  _count: { comments: number; attachments: number }
}

interface DBColumn {
  id: string
  title: string
  position: number
  color: string | null
  wipLimit: number | null
  tickets: DBTicket[]
}

interface DBBoard {
  id: string
  title: string
  projectId: string
  columns: DBColumn[]
}

interface ProjectKanbanBoardProps {
  projectId: string
  readOnly?: boolean
}

const COLUMN_ORDER = ["Backlog", "To Do", "In Progress", "Review", "QA Testing", "Done"]

const SPRINT_ALL = "__all__"
const SPRINT_BACKLOG = "__backlog__"
const ASSIGNEE_ALL = "__all__"
const ASSIGNEE_UNASSIGNED = "__unassigned__"

const columnColors: Record<string, { bg: string; border: string; badge: string }> = {
  "To Do": { bg: "bg-slate-50 dark:bg-slate-900/50", border: "border-t-slate-400", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  Backlog: { bg: "bg-zinc-50 dark:bg-zinc-900/50", border: "border-t-zinc-500", badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  "In Progress": { bg: "bg-blue-50/50 dark:bg-blue-950/20", border: "border-t-blue-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  Review: { bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-t-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  "QA Testing": { bg: "bg-pink-50/50 dark:bg-pink-950/20", border: "border-t-pink-500", badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  Done: { bg: "bg-emerald-50/50 dark:bg-emerald-950/20", border: "border-t-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
}

function getPriorityColor(p: string) {
  switch (p.toUpperCase()) {
    case "HIGH": return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400"
    case "URGENT": return "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400"
    case "MEDIUM": return "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
    case "LOW": return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
    default: return "bg-gray-100 text-gray-700"
  }
}

function getTypeColor(t: string) {
  switch (t.toUpperCase()) {
    case "BUG": return "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
    case "FEATURE": return "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
    case "TASK": return "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
    case "RESEARCH": return "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
    case "LEGAL_REVIEW": return "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
    case "CLIENT_INTAKE": return "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400"
    default: return "bg-gray-50 text-gray-600"
  }
}

function ticketMatchesFilters(
  ticket: DBTicket,
  sprintFilter: string,
  assigneeFilter: string,
): boolean {
  if (assigneeFilter === ASSIGNEE_UNASSIGNED) {
    if (ticket.assignee) return false
  } else if (assigneeFilter !== ASSIGNEE_ALL) {
    if (ticket.assignee?.id !== assigneeFilter) return false
  }

  if (sprintFilter === SPRINT_BACKLOG) {
    if (ticket.sprint?.id || ticket.sprintId) return false
  } else if (sprintFilter !== SPRINT_ALL) {
    const sid = ticket.sprint?.id || ticket.sprintId
    if (sid !== sprintFilter) return false
  }

  return true
}

export function ProjectKanbanBoard({ projectId, readOnly = false }: ProjectKanbanBoardProps) {
  const [board, setBoard] = useState<DBBoard | null>(null)
  const [sprints, setSprints] = useState<DBSprint[]>([])
  const [members, setMembers] = useState<DBUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSprintOpen, setIsSprintOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<DBTicket | null>(null)
  const [sprintFilter, setSprintFilter] = useState(SPRINT_ALL)
  const [assigneeFilter, setAssigneeFilter] = useState(ASSIGNEE_ALL)
  const { isAuthenticated, isAdmin, isManager } = useAuth()
  const canCreateTicket = !readOnly && (isAdmin || isManager)
  const canManageSprints = !readOnly && (isAdmin || isManager)

  const authHeaders = useCallback((): HeadersInit => ({
    "Content-Type": "application/json",
  }), [])

  const fetchBoard = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { credentials: "include" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load board")

      const sorted = (data.project?.board?.columns || []).sort((a: DBColumn, b: DBColumn) => {
        const ai = COLUMN_ORDER.indexOf(a.title)
        const bi = COLUMN_ORDER.indexOf(b.title)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1
        return a.position - b.position
      })

      setBoard({ ...data.project.board, columns: sorted } as DBBoard)
      setSprints(data.project.sprints || [])
      setMembers(
        (data.project.members || []).map((m: { user: DBUser }) => m.user),
      )
    } catch (err: unknown) {
      toast.error("Failed to load board", {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchBoard()
    if (process.env.NEXT_PUBLIC_PUSHER_KEY && projectId) {
      import("@/lib/pusher")
        .then(({ pusherClient }) => {
          const channel = pusherClient.subscribe(`project-${projectId}`)
          channel.bind("ticket-created", () => fetchBoard())
          channel.bind("ticket-updated", () => fetchBoard())
          return () => {
            pusherClient.unsubscribe(`project-${projectId}`)
          }
        })
        .catch(console.error)
    }
  }, [fetchBoard, projectId])

  const filteredColumns = useMemo(() => {
    if (!board) return []
    return board.columns.map((col) => ({
      ...col,
      tickets: col.tickets.filter((t) => ticketMatchesFilters(t, sprintFilter, assigneeFilter)),
    }))
  }, [board, sprintFilter, assigneeFilter])

  const activeSprint = sprints.find((s) => s.status === "ACTIVE")
  const filtersActive = sprintFilter !== SPRINT_ALL || assigneeFilter !== ASSIGNEE_ALL

  const handleDragEnd = async (result: { destination?: { droppableId: string; index: number } | null; source: { droppableId: string; index: number }; draggableId: string }) => {
    if (readOnly || !canCreateTicket || filtersActive) return
    const { destination, source, draggableId } = result
    if (!destination || !board) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const sourceCol = board.columns.find((c) => c.id === source.droppableId)
    const destCol = board.columns.find((c) => c.id === destination.droppableId)
    if (!sourceCol || !destCol) return

    const ticket = sourceCol.tickets[source.index]
    const newSourceTickets = [...sourceCol.tickets]
    newSourceTickets.splice(source.index, 1)
    const newDestTickets =
      source.droppableId === destination.droppableId ? newSourceTickets : [...destCol.tickets]
    newDestTickets.splice(destination.index, 0, ticket)

    const updatedColumns = board.columns.map((col) => {
      if (col.id === source.droppableId) return { ...col, tickets: newSourceTickets }
      if (col.id === destination.droppableId) return { ...col, tickets: newDestTickets }
      return col
    })

    setBoard({ ...board, columns: updatedColumns })
    setIsSaving(true)

    try {
      const updateData: { position: number; columnId?: string } = { position: destination.index }
      if (source.droppableId !== destination.droppableId) {
        updateData.columnId = destination.droppableId
      }

      const res = await fetch(`/api/tickets/${draggableId}`, {
        method: "PATCH",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify(updateData),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }
      if (source.droppableId !== destination.droppableId) {
        toast.success(`Moved to ${destCol.title}`)
      }
    } catch (err: unknown) {
      toast.error("Failed to save move", {
        description: err instanceof Error ? err.message : undefined,
      })
      fetchBoard()
    } finally {
      setIsSaving(false)
    }
  }

  const handleTicketCreated = (newTicket: DBTicket) => {
    if (!board) return
    const todoCol = board.columns.find((c) => c.title === "To Do") || board.columns[0]
    if (!todoCol) return
    const updatedColumns = board.columns.map((col) =>
      col.id === todoCol.id ? { ...col, tickets: [newTicket, ...col.tickets] } : col,
    )
    setBoard({ ...board, columns: updatedColumns })
  }

  const handleTicketUpdated = (updatedTicket: DBTicket) => {
    if (!board) return
    const updatedColumns = board.columns.map((col) => ({
      ...col,
      tickets: col.tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)),
    }))
    setBoard({ ...board, columns: updatedColumns })
    setSelectedTicket(updatedTicket)
  }

  const todoColumnId = board?.columns.find((c) => c.title === "To Do")?.id || board?.columns[0]?.id || ""
  const createSprintId =
    sprintFilter !== SPRINT_ALL && sprintFilter !== SPRINT_BACKLOG ? sprintFilter : undefined

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full max-w-xl" />
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[420px] w-[260px] shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No board found for this project.</p>
          <Button variant="outline" size="sm" onClick={fetchBoard} className="mt-3 h-8 text-xs">
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 pb-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Board</h2>
            {activeSprint ? (
              <Badge variant="secondary" className="text-[10px] h-5">
                {activeSprint.name}
              </Badge>
            ) : null}
            {isSaving ? (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={fetchBoard} className="h-7 w-7" title="Refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {canManageSprints ? (
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setIsSprintOpen(true)}>
                <Flag className="h-3 w-3 mr-1" />
                Sprints
              </Button>
            ) : null}
            {canCreateTicket ? (
              <Button size="sm" className="h-7 text-[11px] px-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Ticket
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Select value={sprintFilter} onValueChange={setSprintFilter}>
            <SelectTrigger className="h-7 w-[140px] text-[11px]">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SPRINT_ALL} className="text-xs">
                All sprints
              </SelectItem>
              <SelectItem value={SPRINT_BACKLOG} className="text-xs">
                Backlog (no sprint)
              </SelectItem>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.name} ({s.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="h-7 w-[140px] text-[11px]">
              <Users className="h-3 w-3 mr-1 shrink-0" />
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ASSIGNEE_ALL} className="text-xs">
                All assignees
              </SelectItem>
              <SelectItem value={ASSIGNEE_UNASSIGNED} className="text-xs">
                Unassigned
              </SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtersActive ? (
            <span className="text-[10px] text-muted-foreground">Clear filters to drag tickets</span>
          ) : null}
        </div>
      </div>

      {/* Board — horizontal scroll outer, vertical scroll per column */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full min-h-0 gap-3 pr-2">
            {filteredColumns.map((column) => {
              const colors = columnColors[column.title] || columnColors["To Do"]
              return (
                <div key={column.id} className="flex h-full max-h-full w-[260px] shrink-0 flex-col">
                  <div className={`rounded-t-lg px-2.5 py-2 border-t-[3px] ${colors.border} bg-card shrink-0`}>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold">{column.title}</span>
                      <Badge variant="secondary" className={`text-[9px] font-medium h-4 px-1.5 ${colors.badge}`}>
                        {column.tickets.length}
                        {column.wipLimit ? `/${column.wipLimit}` : ""}
                      </Badge>
                    </div>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-0 overflow-y-auto overscroll-y-contain rounded-b-lg p-1.5 transition-colors ${
                          snapshot.isDraggingOver ? "bg-primary/5 ring-1 ring-primary/20" : colors.bg
                        }`}
                      >
                        {column.tickets.map((ticket, index) => (
                          <Draggable
                            key={ticket.id}
                            draggableId={ticket.id}
                            index={index}
                            isDragDisabled={readOnly || !canCreateTicket || filtersActive}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedTicket(ticket)}
                                className="mb-1.5"
                              >
                                <Card
                                  className={`cursor-pointer border shadow-none transition-all ${
                                    snapshot.isDragging ? "shadow-md rotate-1" : "hover:shadow-sm"
                                  }`}
                                >
                                  <CardContent className="p-2">
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between items-start gap-1">
                                        <Badge
                                          className={`${getTypeColor(ticket.type)} text-[9px] font-medium px-1 py-0 h-4`}
                                          variant="secondary"
                                        >
                                          {ticket.type.replace("_", " ")}
                                        </Badge>
                                        <Badge
                                          className={`${getPriorityColor(ticket.priority)} text-[8px] font-semibold px-1 py-0 h-4`}
                                          variant="secondary"
                                        >
                                          {ticket.priority}
                                        </Badge>
                                      </div>
                                      <h3 className="font-medium text-[11px] leading-snug line-clamp-2">
                                        {ticket.title}
                                      </h3>
                                      {ticket.sprint?.name ? (
                                        <Badge variant="outline" className="text-[8px] h-4 px-1 font-normal">
                                          {ticket.sprint.name}
                                        </Badge>
                                      ) : null}
                                      {ticket.description ? (
                                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                                          {stripMarkdown(ticket.description)}
                                        </p>
                                      ) : null}
                                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-border/60">
                                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                                          {ticket.dueDate ? (
                                            <span className="flex items-center gap-0.5">
                                              <Calendar className="h-2.5 w-2.5" />
                                              {new Date(ticket.dueDate).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                              })}
                                            </span>
                                          ) : null}
                                          {ticket._count.comments > 0 ? (
                                            <span className="flex items-center gap-0.5">
                                              <MessageSquare className="h-2.5 w-2.5" />
                                              {ticket._count.comments}
                                            </span>
                                          ) : null}
                                          {ticket._count.attachments > 0 ? (
                                            <span className="flex items-center gap-0.5">
                                              <Paperclip className="h-2.5 w-2.5" />
                                              {ticket._count.attachments}
                                            </span>
                                          ) : null}
                                        </div>
                                        {ticket.assignee ? (
                                          <Avatar className="h-5 w-5 ring-1 ring-background">
                                            <AvatarImage src={ticket.assignee.avatar || undefined} alt={ticket.assignee.name} />
                                            <AvatarFallback className="text-[8px]">
                                              {ticket.assignee.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                        ) : (
                                          <div className="h-5 w-5 rounded-full bg-muted border border-dashed border-muted-foreground/30" />
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {column.tickets.length === 0 ? (
                          <div className="flex items-center justify-center h-16">
                            <p className="text-[10px] text-muted-foreground/60">Empty</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      <CreateTicketDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        projectId={projectId}
        columnId={todoColumnId}
        sprintId={createSprintId}
        onTicketCreated={handleTicketCreated}
      />

      <SprintManagerDialog
        open={isSprintOpen}
        onOpenChange={setIsSprintOpen}
        projectId={projectId}
        sprints={sprints}
        onSprintsChange={setSprints}
      />

      <TicketDetailsDialog
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedTicket(null)
        }}
        onTicketUpdated={handleTicketUpdated}
        readOnly={readOnly}
        projectId={projectId}
        sprints={sprints}
      />
    </div>
  )
}
