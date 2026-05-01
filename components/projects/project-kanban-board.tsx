"use client"

import { useState, useEffect, useCallback } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Calendar, MessageSquare, Paperclip, RefreshCw, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { CreateTicketDialog } from "@/components/kanban/create-ticket-dialog"
import { TicketDetailsDialog } from "@/components/kanban/ticket-details-dialog"

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
  /** Read-only board (e.g. client portal) — no drag, no create */
  readOnly?: boolean
}

// Column ordering and style config
const COLUMN_ORDER = [
  "Backlog",
  "To Do",
  "In Progress",
  "Review",
  "QA Testing",
  "Done",
]

const columnColors: Record<string, { bg: string; border: string; badge: string }> = {
  "To Do": { bg: "bg-slate-50 dark:bg-slate-900/50", border: "border-t-slate-400", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  "Backlog": { bg: "bg-zinc-50 dark:bg-zinc-900/50", border: "border-t-zinc-500", badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  "In Progress": { bg: "bg-blue-50/50 dark:bg-blue-950/20", border: "border-t-blue-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  "Review": { bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-t-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  "QA Testing": { bg: "bg-pink-50/50 dark:bg-pink-950/20", border: "border-t-pink-500", badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  "Done": { bg: "bg-emerald-50/50 dark:bg-emerald-950/20", border: "border-t-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
}

const getPriorityColor = (p: string) => {
  switch (p.toUpperCase()) {
    case "HIGH": return "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400"
    case "URGENT": return "bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-400"
    case "MEDIUM": return "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
    case "LOW": return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
    default: return "bg-gray-100 text-gray-700"
  }
}

const getTypeColor = (t: string) => {
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

export function ProjectKanbanBoard({ projectId, readOnly = false }: ProjectKanbanBoardProps) {
  const [board, setBoard] = useState<DBBoard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<DBTicket | null>(null)
  const { isAuthenticated, isAdmin, isManager } = useAuth()
  const canCreateTicket = !readOnly && (isAdmin || isManager)

  const authHeaders = useCallback((): HeadersInit => ({
    "Content-Type": "application/json",
  }), [])

  const fetchBoard = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load board")

      // Sort columns by defined order, then by position
      const sorted = (data.project?.board?.columns || []).sort((a: DBColumn, b: DBColumn) => {
        const ai = COLUMN_ORDER.indexOf(a.title)
        const bi = COLUMN_ORDER.indexOf(b.title)
        if (ai !== -1 && bi !== -1) return ai - bi
        if (ai !== -1) return -1
        if (bi !== -1) return 1
        return a.position - b.position
      })

      setBoard({ ...data.project.board, columns: sorted } as DBBoard)
    } catch (err: any) {
      toast.error("Failed to load board", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }, [projectId, isAuthenticated])

  useEffect(() => {
    fetchBoard()

    // Real-time updates
    if (process.env.NEXT_PUBLIC_PUSHER_KEY && projectId) {
      import('@/lib/pusher').then(({ pusherClient }) => {
        const channel = pusherClient.subscribe(`project-${projectId}`)
        channel.bind('ticket-created', () => fetchBoard())
        channel.bind('ticket-updated', () => fetchBoard())

        return () => {
          pusherClient.unsubscribe(`project-${projectId}`)
        }
      }).catch(console.error)
    }
  }, [fetchBoard, projectId])

  const handleDragEnd = async (result: any) => {
    if (readOnly) return
    const { destination, source, draggableId } = result
    if (!destination || !board) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const sourceCol = board.columns.find(c => c.id === source.droppableId)
    const destCol = board.columns.find(c => c.id === destination.droppableId)
    if (!sourceCol || !destCol) return

    const ticket = sourceCol.tickets[source.index]
    const newSourceTickets = [...sourceCol.tickets]
    newSourceTickets.splice(source.index, 1)
    const newDestTickets = source.droppableId === destination.droppableId ? newSourceTickets : [...destCol.tickets]
    newDestTickets.splice(destination.index, 0, ticket)

    const updatedColumns = board.columns.map(col => {
      if (col.id === source.droppableId) return { ...col, tickets: newSourceTickets }
      if (col.id === destination.droppableId) return { ...col, tickets: newDestTickets }
      return col
    })

    // Optimistic update
    setBoard({ ...board, columns: updatedColumns })
    setIsSaving(true)

    try {
      const updateData: any = { position: destination.index }
      if (source.droppableId !== destination.droppableId) {
        updateData.columnId = destination.droppableId
      }

      const res = await fetch(`/api/tickets/${draggableId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(updateData),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error)
      }

      if (source.droppableId !== destination.droppableId) {
        toast.success(`Moved to ${destCol.title}`)
      }
    } catch (err: any) {
      toast.error("Failed to save move", { description: err.message })
      fetchBoard() // Revert on failure
    } finally {
      setIsSaving(false)
    }
  }

  const handleTicketCreated = (newTicket: DBTicket) => {
    if (!board) return
    // Find "To Do" column first, then first column
    const todoCol = board.columns.find(c => c.title === "To Do") || board.columns[0]
    if (!todoCol) return

    const updatedColumns = board.columns.map(col => {
      if (col.id === todoCol.id) {
        return { ...col, tickets: [newTicket, ...col.tickets] }
      }
      return col
    })
    setBoard({ ...board, columns: updatedColumns })
  }

  const handleTicketUpdated = (updatedTicket: DBTicket) => {
    if (!board) return
    const updatedColumns = board.columns.map(col => ({
      ...col,
      tickets: col.tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t),
    }))
    setBoard({ ...board, columns: updatedColumns })
    setSelectedTicket(updatedTicket)
  }

  // Get the "To Do" column id for ticket creation
  const todoColumnId = board?.columns.find(c => c.title === "To Do")?.id || board?.columns[0]?.id || ""

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[300px] flex-shrink-0">
              <Skeleton className="h-12 w-full rounded-t-xl" />
              <Skeleton className="h-[500px] w-full rounded-b-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No board found for this project.</p>
          <Button variant="outline" onClick={fetchBoard} className="mt-3">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Project Tasks</h2>
          {isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchBoard} className="h-9 w-9" title="Refresh board">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canCreateTicket && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6 scroll-smooth">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            {board.columns.map((column) => {
              const colors = columnColors[column.title] || columnColors["To Do"]
              return (
                <div key={column.id} className="flex-shrink-0 w-[300px]">
                  <div className={`rounded-t-xl p-3 font-medium border-t-[3px] ${colors.border} bg-card`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">{column.title}</span>
                      <Badge variant="secondary" className={`text-xs font-bold ${colors.badge}`}>
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
                        className={`rounded-b-xl p-2 min-h-[500px] transition-colors duration-200 ${snapshot.isDraggingOver
                          ? "bg-primary/5 ring-2 ring-primary/20 ring-inset"
                          : colors.bg
                          }`}
                      >
                        {column.tickets.map((ticket, index) => (
                          <Draggable key={ticket.id} draggableId={ticket.id} index={index} isDragDisabled={readOnly || !canCreateTicket}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedTicket(ticket)}
                                className="mb-2"
                              >
                                <Card
                                  className={`cursor-pointer transition-all duration-200 border-0 shadow-sm ${snapshot.isDragging
                                    ? "shadow-xl rotate-2 scale-105"
                                    : "hover:shadow-md hover:-translate-y-0.5"
                                    }`}
                                >
                                  <CardContent className="p-3.5">
                                    <div className="space-y-2.5">
                                      <div className="flex justify-between items-start gap-2">
                                        <Badge
                                          className={`${getTypeColor(ticket.type)} text-[11px] font-medium px-2 py-0`}
                                          variant="secondary"
                                        >
                                          {ticket.type.replace("_", " ")}
                                        </Badge>
                                        <Badge
                                          className={`${getPriorityColor(ticket.priority)} text-[10px] font-bold px-1.5 py-0`}
                                          variant="secondary"
                                        >
                                          {ticket.priority}
                                        </Badge>
                                      </div>
                                      <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
                                        {ticket.title}
                                      </h3>
                                      {ticket.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {ticket.description}
                                        </p>
                                      )}
                                      <div className="flex justify-between items-center pt-1.5 border-t border-dashed">
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          {ticket.dueDate && (
                                            <span className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              {new Date(ticket.dueDate).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                              })}
                                            </span>
                                          )}
                                          {ticket._count.comments > 0 && (
                                            <span className="flex items-center gap-1">
                                              <MessageSquare className="h-3 w-3" />
                                              {ticket._count.comments}
                                            </span>
                                          )}
                                          {ticket._count.attachments > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Paperclip className="h-3 w-3" />
                                              {ticket._count.attachments}
                                            </span>
                                          )}
                                        </div>
                                        {ticket.assignee ? (
                                          <Avatar className="h-6 w-6 ring-2 ring-background">
                                            <AvatarImage
                                              src={ticket.assignee.avatar || undefined}
                                              alt={ticket.assignee.name}
                                            />
                                            <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                                              {ticket.assignee.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                        ) : (
                                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                            <span className="text-[9px] text-muted-foreground">?</span>
                                          </div>
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

                        {column.tickets.length === 0 && (
                          <div className="flex items-center justify-center h-24 text-center">
                            <p className="text-xs text-muted-foreground/60">Drop tickets here</p>
                          </div>
                        )}
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
        onTicketCreated={handleTicketCreated}
      />

      <TicketDetailsDialog
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedTicket(null)
        }}
        onTicketUpdated={handleTicketUpdated}
        readOnly={readOnly}
      />
    </div>
  )
}
