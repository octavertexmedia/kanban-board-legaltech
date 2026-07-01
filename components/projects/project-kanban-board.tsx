"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Calendar,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Loader2,
  Flag,
  Users,
  Search,
  X,
  Bug,
  CheckSquare,
  Sparkles,
  BookOpen,
  Scale,
  UserPlus,
  ChevronUp,
  Minus,
  ChevronDown,
  LayoutGrid,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { CreateTicketDialog } from "@/components/kanban/create-ticket-dialog"
import { TicketDetailsDialog } from "@/components/kanban/ticket-details-dialog"
import { SprintManagerDialog, type DBSprint } from "@/components/projects/sprint-manager-dialog"
import { ticketDisplayKey } from "@/lib/ticket-key"
import { cn } from "@/lib/utils"

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
  projectName?: string
  readOnly?: boolean
}

const COLUMN_ORDER = ["Backlog", "To Do", "In Progress", "Review", "QA Testing", "Done"]
const COLUMN_WIDTH = 280

const SPRINT_ALL = "__all__"
const SPRINT_BACKLOG = "__backlog__"
const ASSIGNEE_ALL = "__all__"
const ASSIGNEE_UNASSIGNED = "__unassigned__"

const columnAccent: Record<string, string> = {
  Backlog: "bg-zinc-400",
  "To Do": "bg-slate-500",
  "In Progress": "bg-blue-500",
  Review: "bg-amber-500",
  "QA Testing": "bg-violet-500",
  Done: "bg-emerald-500",
}

function TypeIcon({ type, className }: { type: string; className?: string }) {
  const t = type.toUpperCase()
  const props = { className: cn("h-3.5 w-3.5 shrink-0", className) }
  switch (t) {
    case "BUG":
      return <Bug {...props} className={cn(props.className, "text-red-500")} />
    case "FEATURE":
      return <Sparkles {...props} className={cn(props.className, "text-violet-500")} />
    case "TASK":
      return <CheckSquare {...props} className={cn(props.className, "text-blue-500")} />
    case "RESEARCH":
      return <BookOpen {...props} className={cn(props.className, "text-amber-600")} />
    case "LEGAL_REVIEW":
      return <Scale {...props} className={cn(props.className, "text-purple-600")} />
    case "CLIENT_INTAKE":
      return <UserPlus {...props} className={cn(props.className, "text-teal-600")} />
    default:
      return <CheckSquare {...props} className={cn(props.className, "text-muted-foreground")} />
  }
}

function PriorityIcon({ priority }: { priority: string }) {
  const p = priority.toUpperCase()
  if (p === "URGENT" || p === "HIGH") {
    return <ChevronUp className="h-3.5 w-3.5 text-red-500" aria-label={priority} />
  }
  if (p === "LOW") {
    return <ChevronDown className="h-3.5 w-3.5 text-blue-500" aria-label={priority} />
  }
  return <Minus className="h-3.5 w-3.5 text-amber-500" aria-label={priority} />
}

function ticketMatchesFilters(
  ticket: DBTicket,
  sprintFilter: string,
  assigneeFilter: string,
  searchQuery: string,
): boolean {
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    const hay = `${ticket.title} ${ticket.description || ""} ${ticket.type}`.toLowerCase()
    if (!hay.includes(q)) return false
  }

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

export function ProjectKanbanBoard({
  projectId,
  projectName = "Project",
  readOnly = false,
}: ProjectKanbanBoardProps) {
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
  const [searchQuery, setSearchQuery] = useState("")
  const { isAdmin, isManager } = useAuth()
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
      setMembers((data.project.members || []).map((m: { user: DBUser }) => m.user))
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
      tickets: col.tickets.filter((t) =>
        ticketMatchesFilters(t, sprintFilter, assigneeFilter, searchQuery),
      ),
    }))
  }, [board, sprintFilter, assigneeFilter, searchQuery])

  const totalVisible = filteredColumns.reduce((n, c) => n + c.tickets.length, 0)
  const activeSprint = sprints.find((s) => s.status === "ACTIVE")
  const filtersActive =
    sprintFilter !== SPRINT_ALL ||
    assigneeFilter !== ASSIGNEE_ALL ||
    searchQuery.trim().length > 0

  const clearFilters = () => {
    setSprintFilter(SPRINT_ALL)
    setAssigneeFilter(ASSIGNEE_ALL)
    setSearchQuery("")
  }

  const handleDragEnd = async (result: {
    destination?: { droppableId: string; index: number } | null
    source: { droppableId: string; index: number }
    draggableId: string
  }) => {
    if (readOnly || !canCreateTicket || filtersActive) return
    const { destination, source, draggableId } = result
    if (!destination || !board) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const sourceCol = board.columns.find((c) => c.id === source.droppableId)
    const destCol = board.columns.find((c) => c.id === destination.droppableId)
    if (!sourceCol || !destCol) return

    const ticketIndex = sourceCol.tickets.findIndex((t) => t.id === draggableId)
    if (ticketIndex === -1) return
    const ticket = sourceCol.tickets[ticketIndex]

    const newSourceTickets = [...sourceCol.tickets]
    newSourceTickets.splice(ticketIndex, 1)
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
      <div className="flex h-full min-h-0 flex-col rounded-lg border bg-[#F4F5F7] p-3 dark:bg-muted/20">
        <Skeleton className="mb-3 h-9 w-full max-w-2xl" />
        <div className="flex flex-1 gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-full w-[280px] shrink-0 rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border bg-[#F4F5F7] dark:bg-muted/20">
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-[#F4F5F7] dark:bg-muted/20">
      {/* Jira-style board toolbar */}
      <div className="shrink-0 space-y-2 border-b border-border/50 bg-background/80 px-3 py-2 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </div>
            {activeSprint ? (
              <Badge variant="outline" className="h-6 text-[11px] font-normal">
                {activeSprint.name}
              </Badge>
            ) : null}
            <span className="text-[11px] text-muted-foreground">
              {totalVisible} issue{totalVisible === 1 ? "" : "s"}
            </span>
            {isSaving ? (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={fetchBoard} className="h-8 w-8" title="Refresh">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            {canManageSprints ? (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsSprintOpen(true)}>
                <Flag className="mr-1.5 h-3.5 w-3.5" />
                Sprints
              </Button>
            ) : null}
            {canCreateTicket ? (
              <Button size="sm" className="h-8 text-xs" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search board..."
              className="h-8 border-border/60 bg-background pl-8 text-xs"
            />
          </div>
          <Select value={sprintFilter} onValueChange={setSprintFilter}>
            <SelectTrigger className="h-8 w-[130px] border-border/60 bg-background text-xs">
              <SelectValue placeholder="Sprint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SPRINT_ALL} className="text-xs">All sprints</SelectItem>
              <SelectItem value={SPRINT_BACKLOG} className="text-xs">Backlog</SelectItem>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="h-8 w-[130px] border-border/60 bg-background text-xs">
              <Users className="mr-1 h-3 w-3 shrink-0" />
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ASSIGNEE_ALL} className="text-xs">All assignees</SelectItem>
              <SelectItem value={ASSIGNEE_UNASSIGNED} className="text-xs">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtersActive ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground" onClick={clearFilters}>
              <X className="h-3 w-3" />
              Clear filters
            </Button>
          ) : null}
          {filtersActive ? (
            <span className="text-[10px] text-muted-foreground">Drag disabled while filtering</span>
          ) : null}
        </div>
      </div>

      {/* Board canvas */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden p-3">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full min-h-0 gap-2" style={{ minWidth: filteredColumns.length * (COLUMN_WIDTH + 8) }}>
            {filteredColumns.map((column) => {
              const accent = columnAccent[column.title] || columnAccent["To Do"]
              const overWip = column.wipLimit != null && column.tickets.length > column.wipLimit

              return (
                <div
                  key={column.id}
                  className="flex h-full min-h-0 shrink-0 flex-col rounded-md bg-[#EBECF0]/90 dark:bg-muted/40"
                  style={{ width: COLUMN_WIDTH }}
                >
                  {/* Sticky column header */}
                  <div className="sticky top-0 z-10 shrink-0 px-2.5 pb-2 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", accent)} />
                        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-[#44546F] dark:text-foreground">
                          {column.title}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                          overWip
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {column.tickets.length}
                        {column.wipLimit ? ` / ${column.wipLimit}` : ""}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-y-contain px-2 pb-2",
                          snapshot.isDraggingOver && "bg-primary/5",
                        )}
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
                                className={cn(
                                  "group cursor-pointer rounded-md border border-border/70 bg-background shadow-sm transition-shadow",
                                  snapshot.isDragging
                                    ? "rotate-1 shadow-lg ring-2 ring-primary/30"
                                    : "hover:shadow-md hover:border-border",
                                )}
                              >
                                <div className="p-2.5">
                                  <div className="mb-1.5 flex items-start justify-between gap-1">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      <TypeIcon type={ticket.type} />
                                      <span className="truncate text-[10px] font-medium text-muted-foreground">
                                        {ticketDisplayKey(projectName, ticket.id)}
                                      </span>
                                    </div>
                                    <PriorityIcon priority={ticket.priority} />
                                  </div>

                                  <p className="mb-2 line-clamp-3 text-[13px] font-medium leading-snug text-foreground">
                                    {ticket.title}
                                  </p>

                                  {ticket.labels.length > 0 ? (
                                    <div className="mb-2 flex flex-wrap gap-1">
                                      {ticket.labels.slice(0, 3).map(({ label }) => (
                                        <span
                                          key={label.id}
                                          className="max-w-[80px] truncate rounded px-1.5 py-0.5 text-[9px] font-medium text-white"
                                          style={{ backgroundColor: label.color }}
                                          title={label.name}
                                        >
                                          {label.name}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}

                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                      {ticket.dueDate ? (
                                        <span
                                          className={cn(
                                            "flex items-center gap-0.5",
                                            new Date(ticket.dueDate) < new Date() && "text-red-600",
                                          )}
                                        >
                                          <Calendar className="h-3 w-3" />
                                          {new Date(ticket.dueDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })}
                                        </span>
                                      ) : null}
                                      {ticket._count.comments > 0 ? (
                                        <span className="flex items-center gap-0.5">
                                          <MessageSquare className="h-3 w-3" />
                                          {ticket._count.comments}
                                        </span>
                                      ) : null}
                                      {ticket._count.attachments > 0 ? (
                                        <span className="flex items-center gap-0.5">
                                          <Paperclip className="h-3 w-3" />
                                          {ticket._count.attachments}
                                        </span>
                                      ) : null}
                                    </div>
                                    {ticket.assignee ? (
                                      <Avatar className="h-6 w-6" title={ticket.assignee.name}>
                                        <AvatarImage src={ticket.assignee.avatar || undefined} alt={ticket.assignee.name} />
                                        <AvatarFallback className="bg-[#DFE1E6] text-[9px] font-semibold text-[#44546F]">
                                          {ticket.assignee.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <div
                                        className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/30 bg-muted/30"
                                        title="Unassigned"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {column.tickets.length === 0 ? (
                          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-border/50 bg-background/40">
                            <p className="text-[10px] text-muted-foreground">No issues</p>
                          </div>
                        ) : null}

                        {canCreateTicket && column.title === "To Do" ? (
                          <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Create issue
                          </button>
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
