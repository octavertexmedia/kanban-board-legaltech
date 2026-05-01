"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Calendar, Users, BookOpen, LayoutGrid, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { ScheduleMeetingDialog } from "@/components/meetings/schedule-meeting-dialog"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const actions = [
  {
    label: "Projects",
    shortLabel: "Projects",
    icon: LayoutGrid,
    href: "/projects",
  },
  {
    label: "Knowledge",
    shortLabel: "Knowledge",
    icon: BookOpen,
    href: "/knowledge",
  },
  {
    label: "Team",
    shortLabel: "Team",
    icon: Users,
    href: "/users",
  },
  {
    label: "Meeting",
    shortLabel: "Meet",
    icon: Calendar,
    action: "scheduleMeeting" as const,
  },
]

export function QuickActions() {
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const { hasPermission, isAdmin, isManager } = useAuth()

  const visible = actions.filter((item) => {
    if (item.href === "/users" && !isAdmin && !isManager) return false
    if (item.action === "scheduleMeeting" && !hasPermission("manage_meetings") && !hasPermission("join_meetings"))
      return false
    return true
  })

  const openMeeting = () => {
    setMoreOpen(false)
    setIsScheduleMeetingOpen(true)
  }

  return (
    <div className="rounded-md border border-border bg-card px-2 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mr-1 pl-1">
          Quick
        </span>
        {visible.map((item) => {
          const Icon = item.icon
          const btnClass =
            "h-7 px-2 text-xs gap-1.5 font-medium border-border shadow-none hover:bg-muted/80"

          if (item.href) {
            return (
              <Button key={item.label} asChild variant="outline" size="sm" className={btnClass}>
                <Link href={item.href}>
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                  {item.shortLabel}
                </Link>
              </Button>
            )
          }

          return (
            <Button
              key={item.label}
              type="button"
              variant="outline"
              size="sm"
              className={btnClass}
              onClick={() => setIsScheduleMeetingOpen(true)}
            >
              <Icon className="h-3.5 w-3.5 opacity-80" />
              {item.shortLabel}
            </Button>
          )
        })}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={() => setMoreOpen(true)}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:inline">More</span>
        </Button>
      </div>

      <ScheduleMeetingDialog open={isScheduleMeetingOpen} onOpenChange={setIsScheduleMeetingOpen} />

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-sm gap-3">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm font-semibold">Shortcuts</DialogTitle>
            <DialogDescription className="text-xs">Jump to workspace areas</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {visible.map((item) => {
              const Icon = item.icon
              const cell = cn(
                "flex items-center gap-2 rounded border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted/60",
              )

              if (item.href) {
                return (
                  <Link key={item.label} href={item.href} onClick={() => setMoreOpen(false)} className={cell}>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Link>
                )
              }
              return (
                <button type="button" key={item.label} className={cn(cell, "text-left w-full")} onClick={openMeeting}>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  Schedule meeting
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
