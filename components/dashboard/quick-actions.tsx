"use client"

import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, LayoutGrid, CalendarDays } from "lucide-react"
import Link from "next/link"
import { ScheduleMeetingDialog } from "@/components/meetings/schedule-meeting-dialog"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

type QuickItem = {
  id: string
  /** Left of colon (omit second line when `label` empty — single phrase) */
  caption: string
  /** Right of colon; empty = render `caption` only */
  label: string
  icon: typeof LayoutGrid
  href?: string
  /** Solid button: background + hover (text stays white) */
  solid: string
  show: boolean
}

export function QuickActions() {
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false)
  const { hasPermission, isAdmin, isManager } = useAuth()

  const canTeam = isAdmin || isManager
  const canSchedule = hasPermission("manage_meetings") || hasPermission("join_meetings")

  const items: QuickItem[] = [
    {
      id: "projects",
      caption: "Projects",
      label: "Projects",
      icon: LayoutGrid,
      href: "/projects",
      solid: "bg-[#0C66E4] hover:bg-[#0055CC] text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10",
      show: true,
    },
    {
      id: "knowledge",
      caption: "Knowledge",
      label: "Knowledge",
      icon: BookOpen,
      href: "/knowledge",
      solid: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10",
      show: true,
    },
    {
      id: "team",
      caption: "Team",
      label: "Team",
      icon: Users,
      href: "/users",
      solid: "bg-violet-600 hover:bg-violet-700 text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10",
      show: canTeam,
    },
    {
      id: "meet",
      caption: "Meet",
      label: "Meetings",
      icon: CalendarDays,
      href: "/meetings",
      solid: "bg-sky-600 hover:bg-sky-700 text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10",
      show: true,
    },
    {
      id: "schedule",
      caption: "Schedule meeting",
      label: "",
      icon: Calendar,
      solid: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10",
      show: canSchedule,
    },
  ]

  const visible = items.filter((i) => i.show)

  return (
    <div className="rounded-lg border border-border bg-gradient-to-b from-card to-muted/20 px-2.5 py-2.5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pl-0.5">
          Quick
        </span>
        <div className="h-px flex-1 bg-border/80" />
      </div>
      <div className="flex flex-wrap items-stretch gap-1.5">
        {visible.map((item) => {
          const Icon = item.icon
          const inner = (
            <>
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-95" aria-hidden />
              {item.label ? (
                <span className="flex items-baseline gap-0.5 min-w-0 leading-none">
                  <span className="font-medium opacity-90 truncate">{item.caption}</span>
                  <span className="opacity-70 font-normal shrink-0">:</span>
                  <span className="font-semibold truncate">{item.label}</span>
                </span>
              ) : (
                <span className="font-semibold truncate leading-none">{item.caption}</span>
              )}
            </>
          )

          const btnClass = cn(
            "h-7 px-2.5 text-xs gap-1.5 font-medium border-0 transition-colors",
            item.solid,
          )

          if (item.href) {
            return (
              <Button key={item.id} asChild size="sm" className={btnClass}>
                <Link href={item.href}>{inner}</Link>
              </Button>
            )
          }

          return (
            <Button
              key={item.id}
              type="button"
              size="sm"
              className={btnClass}
              onClick={() => setIsScheduleMeetingOpen(true)}
            >
              {inner}
            </Button>
          )
        })}
      </div>

      <ScheduleMeetingDialog open={isScheduleMeetingOpen} onOpenChange={setIsScheduleMeetingOpen} />
    </div>
  )
}
