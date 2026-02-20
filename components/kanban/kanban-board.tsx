"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Calendar, MessageSquare, Paperclip, GripVertical } from "lucide-react"
import { CreateTicketDialog } from "./create-ticket-dialog"
import { TicketDetailsDialog } from "./ticket-details-dialog"
import { initialBoardData, users } from "@/lib/initial-data"
import { notificationService } from "@/lib/services/notification-service"
import { toast } from "sonner"
import type { Board, Ticket } from "@/lib/types"

const columnColors: Record<string, { bg: string; border: string; badge: string }> = {
  "To Do": {
    bg: "bg-slate-50 dark:bg-slate-900/50",
    border: "border-t-slate-400",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  "In Progress": {
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    border: "border-t-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  "Review": {
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    border: "border-t-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  "Done": {
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    border: "border-t-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
}

export function KanbanBoard() {
  const [boardData, setBoardData] = useState(initialBoardData)
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)

  const handleDragEnd = (result: any) => {
    const { destination, source } = result

    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    const sourceColumn = boardData.columns.find((col) => col.id === source.droppableId)
    const destColumn = boardData.columns.find((col) => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    const newSourceTickets = [...sourceColumn.tickets]
    const newDestTickets = sourceColumn.id === destColumn.id ? newSourceTickets : [...destColumn.tickets]

    const [movedTicket] = newSourceTickets.splice(source.index, 1)

    if (sourceColumn.id === destColumn.id) {
      newSourceTickets.splice(destination.index, 0, movedTicket)
    } else {
      newDestTickets.splice(destination.index, 0, movedTicket)
    }

    const newColumns = boardData.columns.map((col) => {
      if (col.id === sourceColumn.id) {
        return { ...col, tickets: newSourceTickets }
      }
      if (col.id === destColumn.id && sourceColumn.id !== destColumn.id) {
        return { ...col, tickets: newDestTickets }
      }
      return col
    })

    setBoardData({ ...boardData, columns: newColumns })

    // Notify assignee of status change via email
    if (sourceColumn.id !== destColumn.id) {
      toast.success(`Moved to ${destColumn.title}`, {
        description: `"${movedTicket.title}" → ${destColumn.title}`,
      })

      // Send notification with email
      notificationService.notify(
        movedTicket.assignee,
        "ticket_status_change",
        {
          title: movedTicket.title,
          ticketId: movedTicket.id,
          projectId: "project-1",
          projectName: "Website Redesign",
          oldStatus: sourceColumn.title,
          newStatus: destColumn.title,
          changedBy: users[0],
        }
      )
    }
  }

  const handleAddTicket = (newTicket: Ticket) => {
    const updatedColumns = boardData.columns.map((column, index) => {
      if (index === 0) {
        return {
          ...column,
          tickets: [newTicket, ...column.tickets],
        }
      }
      return column
    })

    setBoardData({
      ...boardData,
      columns: updatedColumns,
    })

    toast.success("Ticket created", {
      description: `"${newTicket.title}" added to To Do`,
    })

    // Send email notification to assignee
    notificationService.notify(
      newTicket.assignee,
      "ticket_assigned",
      {
        title: newTicket.title,
        description: newTicket.description,
        ticketId: newTicket.id,
        projectId: "project-1",
        projectName: "Website Redesign",
        priority: newTicket.priority,
        dueDate: newTicket.dueDate,
        assignedBy: users[0],
      }
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
      case "low":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "bug":
        return "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
      case "feature":
        return "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
      case "task":
        return "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
      case "research":
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
      default:
        return "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">Manage and track your team's tasks — changes trigger email notifications</p>
        </div>
        <Button
          onClick={() => setIsCreateTicketOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:-mx-6 md:px-6 scroll-smooth">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            {boardData.columns.map((column) => {
              const colors = columnColors[column.title] || columnColors["To Do"]
              return (
                <div key={column.id} className="flex-shrink-0 w-[300px]">
                  <div className={`rounded-t-xl p-3 font-medium border-t-[3px] ${colors.border} bg-card`}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">{column.title}</span>
                      <Badge variant="secondary" className={`text-xs font-bold ${colors.badge}`}>
                        {column.tickets.length}
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
                          <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                onClick={() => setSelectedTicket(ticket)}
                                className="mb-2"
                              >
                                <Card className={`cursor-pointer transition-all duration-200 border-0 shadow-sm ${snapshot.isDragging
                                  ? "shadow-xl rotate-2 scale-105"
                                  : "hover:shadow-md hover:-translate-y-0.5"
                                  }`}>
                                  <CardContent className="p-3.5">
                                    <div className="space-y-2.5">
                                      <div className="flex justify-between items-start gap-2">
                                        <Badge className={`${getTypeColor(ticket.type)} text-[11px] font-medium px-2 py-0`} variant="secondary">
                                          {ticket.type}
                                        </Badge>
                                        <Badge className={`${getPriorityColor(ticket.priority)} text-[10px] font-bold px-1.5 py-0`} variant="secondary">
                                          {ticket.priority}
                                        </Badge>
                                      </div>
                                      <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{ticket.title}</h3>
                                      <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                                      <div className="flex justify-between items-center pt-1.5 border-t border-dashed">
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(ticket.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          </span>
                                          {ticket.comments.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <MessageSquare className="h-3 w-3" />
                                              {ticket.comments.length}
                                            </span>
                                          )}
                                          {ticket.attachments.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Paperclip className="h-3 w-3" />
                                              {ticket.attachments.length}
                                            </span>
                                          )}
                                        </div>
                                        <Avatar className="h-6 w-6 ring-2 ring-background">
                                          <AvatarImage
                                            src={ticket.assignee.avatar || "/placeholder.svg"}
                                            alt={ticket.assignee.name}
                                          />
                                          <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                                            {ticket.assignee.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
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
        open={isCreateTicketOpen}
        onOpenChange={setIsCreateTicketOpen}
      />

      <TicketDetailsDialog
        ticket={selectedTicket as any}
        open={!!selectedTicket}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedTicket(null)
        }}
      />
    </div>
  )
}
