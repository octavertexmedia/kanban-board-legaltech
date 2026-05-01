"use client"

import { PageShell } from "@/components/layout/page-shell"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ProjectsOverview } from "@/components/dashboard/projects-overview"
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings"
import { RecentKnowledgeArticles } from "@/components/dashboard/recent-knowledge-articles"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const { user, isLoading, isAuthenticated, isClientUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/sign-in")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isLoading && isAuthenticated && isClientUser) {
      router.replace("/client")
    }
  }, [isLoading, isAuthenticated, isClientUser, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-xs">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const firstName = user?.name?.split(" ")[0] || "there"
  const roleLabel = user?.role?.replace(/_/g, " ").toLowerCase() || "member"

  return (
    <PageShell className="p-3 md:p-4">
      <div className="max-w-[1600px] mx-auto space-y-3">
        {/* Compact Jira-style header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-2">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground tracking-tight truncate">
              Welcome back, {firstName}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Projects, tickets, and delivery — use <kbd className="px-1 rounded border text-[10px] font-mono bg-muted">⌘K</kbd> to search
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px] font-medium px-2 py-0.5 h-6 rounded-sm capitalize w-fit">
            {roleLabel}
          </Badge>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="h-8 w-full sm:w-auto justify-start rounded border border-border bg-muted/40 p-0.5 gap-0">
            <TabsTrigger
              value="summary"
              className="h-7 rounded-sm px-3 text-xs font-medium data-[state=active]:shadow-none data-[state=active]:border data-[state=active]:border-border"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="h-7 rounded-sm px-3 text-xs font-medium data-[state=active]:shadow-none data-[state=active]:border data-[state=active]:border-border"
            >
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-3 space-y-3 focus-visible:outline-none">
            <QuickActions />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 space-y-3 min-w-0">
                <ProjectsOverview />
                <RecentKnowledgeArticles />
              </div>
              <div className="space-y-3 min-w-0">
                <UpcomingMeetings />
                <ActivityFeed />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-3 focus-visible:outline-none">
            <DashboardCharts dense />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  )
}
