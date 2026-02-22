"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, PanelLeft, LayoutGrid, FileText, Sparkles } from "lucide-react"
import Link from "next/link"
import { CreateTicketDialog } from "@/components/kanban/create-ticket-dialog"
import { ScheduleMeetingDialog } from "@/components/meetings/schedule-meeting-dialog"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

const actions = [
  {
    label: "Schedule Meeting",
    icon: Calendar,
    gradient: "from-violet-500 to-purple-500",
    hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-950/20",
    hoverText: "hover:text-violet-700 dark:hover:text-violet-300",
    action: "scheduleMeeting",
  },
  {
    label: "View Projects",
    icon: LayoutGrid,
    gradient: "from-emerald-500 to-teal-500",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
    hoverText: "hover:text-emerald-700 dark:hover:text-emerald-300",
    href: "/projects",
  },
  {
    label: "Knowledge Base",
    icon: BookOpen,
    gradient: "from-amber-500 to-orange-500",
    hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-950/20",
    hoverText: "hover:text-amber-700 dark:hover:text-amber-300",
    href: "/knowledge",
  },
  {
    label: "Team Members",
    icon: Users,
    gradient: "from-pink-500 to-rose-500",
    hoverBg: "hover:bg-pink-50 dark:hover:bg-pink-950/20",
    hoverText: "hover:text-pink-700 dark:hover:text-pink-300",
    href: "/users",
  },
]

export function QuickActions() {
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false)
  const { hasPermission, isAdmin, isManager } = useAuth()

  // Filter actions based on role
  const visibleActions = actions.filter((item) => {
    if (item.href === "/users" && !isAdmin && !isManager) return false
    if (item.action === "scheduleMeeting" && !hasPermission('manage_meetings') && !hasPermission('join_meetings')) return false
    return true
  })

  const handleAction = (action?: string) => {
    if (action === "scheduleMeeting") setIsScheduleMeetingOpen(true)
  }

  return (
    <Card className="border-0 shadow-xl shadow-black/5 ring-1 ring-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Sparkles className="h-4 w-4" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visibleActions.map((item) => {
            const Icon = item.icon
            const content = (
              <div className="flex flex-col items-center gap-3 py-4 w-full">
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg shadow-black/10 text-white transform transition-transform group-hover:scale-110 group-hover:-translate-y-1`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{item.label}</span>
              </div>
            )

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className="group flex">
                  <div className={`w-full h-full rounded-2xl border border-border/50 bg-card hover:bg-muted/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {content}
                  </div>
                </Link>
              )
            }

            return (
              <button
                key={item.label}
                onClick={() => handleAction(item.action)}
                className="group flex w-full h-full rounded-2xl border border-border/50 bg-card hover:bg-muted/40 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {content}
              </button>
            )
          })}
        </div>

        <ScheduleMeetingDialog
          open={isScheduleMeetingOpen}
          onOpenChange={setIsScheduleMeetingOpen}
        />
      </CardContent>
    </Card>
  )
}
