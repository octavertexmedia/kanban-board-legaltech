"use client"

import { PageShell } from "@/components/layout/page-shell"
import { MeetingsCalendar } from "@/components/meetings/meetings-calendar"
import { TeamTimeline } from "@/components/meetings/team-timeline"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock } from "lucide-react"
import { useState } from "react"

export default function MeetingsPage() {
  const [view, setView] = useState<"list" | "timeline">("list")

  return (
    <PageShell>
      {/* View toggle bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex items-center rounded-lg border bg-card p-1 shadow-sm">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className={`gap-1.5 text-sm transition-all ${view === "list" ? "shadow-sm" : ""}`}
            onClick={() => setView("list")}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Calendar
          </Button>
          <Button
            variant={view === "timeline" ? "default" : "ghost"}
            size="sm"
            className={`gap-1.5 text-sm transition-all ${view === "timeline" ? "shadow-sm" : ""}`}
            onClick={() => setView("timeline")}
          >
            <Clock className="h-3.5 w-3.5" />
            Team Timeline
          </Button>
        </div>
      </div>

      {view === "list" ? <MeetingsCalendar /> : <TeamTimeline />}
    </PageShell>
  )
}
