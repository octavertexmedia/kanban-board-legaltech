"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, BookOpen, PanelLeft, LayoutGrid, FileText, Sparkles } from "lucide-react"
import Link from "next/link"
import { CreateTicketDialog } from "@/components/kanban/create-ticket-dialog"
import { ScheduleMeetingDialog } from "@/components/meetings/schedule-meeting-dialog"
import { useState } from "react"

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

  const handleAction = (action?: string) => {
    if (action === "scheduleMeeting") setIsScheduleMeetingOpen(true)
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {actions.map((item) => {
            const Icon = item.icon
            const content = (
              <div className="flex flex-col items-center gap-2 py-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.gradient} shadow-sm`}>
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            )

            if (item.href) {
              return (
                <Button
                  key={item.label}
                  variant="outline"
                  className={`h-auto border-dashed ${item.hoverBg} ${item.hoverText} transition-all duration-200`}
                  asChild
                >
                  <Link href={item.href}>{content}</Link>
                </Button>
              )
            }

            return (
              <Button
                key={item.label}
                variant="outline"
                className={`h-auto border-dashed ${item.hoverBg} ${item.hoverText} transition-all duration-200`}
                onClick={() => handleAction(item.action)}
              >
                {content}
              </Button>
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
