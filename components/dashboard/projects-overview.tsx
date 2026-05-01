"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowRight, FolderKanban } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface DBProject {
  id: string
  name: string
  status: string
  members: Array<{ user: { id: string; name: string; avatar: string | null } }>
  stats: { progress: number; totalTickets: number }
}

export function ProjectsOverview() {
  const [projects, setProjects] = useState<DBProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetch("/api/projects?limit=3", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => setProjects((data.projects || []).slice(0, 3)))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-3 space-y-0">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
          <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
          Active projects
        </CardTitle>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-0.5 text-muted-foreground hover:text-foreground">
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs font-medium text-foreground">No active projects</p>
            <p className="text-[11px] text-muted-foreground mt-1 mb-3">Create one to get started</p>
            <Link href="/projects">
              <Button size="sm" className="h-7 text-xs">
                Open projects
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => {
              const statusColor =
                project.status === "ACTIVE"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
                  : project.status === "COMPLETED"
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25"
                    : "bg-muted text-muted-foreground border-border"
              const statusLabel = project.status.charAt(0) + project.status.slice(1).toLowerCase()
              const members = project.members?.map((m) => m.user) || []

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="rounded border border-border bg-background hover:bg-muted/40 px-2.5 py-2 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium truncate">{project.name}</span>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 font-medium shrink-0 ${statusColor}`}>
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="flex -space-x-1.5 shrink-0">
                        {members.slice(0, 3).map((member) => (
                          <Avatar key={member.id} className="h-5 w-5 border border-background">
                            <AvatarImage src={member.avatar || undefined} alt={member.name} />
                            <AvatarFallback className="text-[7px] bg-muted">{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 3 && (
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium border border-background">
                            +{members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={project.stats?.progress || 0} className="h-1 flex-1" />
                      <span className="text-[10px] font-medium text-muted-foreground w-8 text-right tabular-nums">
                        {project.stats?.progress || 0}%
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
