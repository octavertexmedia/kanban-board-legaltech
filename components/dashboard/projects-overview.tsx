"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
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
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setProjects((data.projects || []).slice(0, 3)))
      .catch(() => { })
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  return (
    <Card className="border-0 shadow-xl shadow-black/5 ring-1 ring-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M3 15h6" /><path d="M3 18h6" /></svg>
          </div>
          Active Projects
        </CardTitle>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="gap-1 hover:bg-primary/10 hover:text-primary transition-colors">
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl opacity-50">📂</span>
            </div>
            <p className="font-medium text-foreground">No active projects</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">It's quiet in here...</p>
            <Link href="/projects">
              <Button size="sm" className="bg-primary/90 hover:bg-primary shadow-md shadow-primary/20 transition-all">Create Project</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const statusColor =
                project.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                  project.status === "COMPLETED" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                    "bg-gray-500/10 text-gray-600 border-gray-500/20"
              const statusLabel = project.status.charAt(0) + project.status.slice(1).toLowerCase()
              const members = project.members?.map(m => m.user) || []

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="group relative bg-card hover:bg-muted/40 border border-border/50 rounded-xl p-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </div>
                        <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 font-semibold shrink-0 ${statusColor}`}>
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="flex -space-x-2 shrink-0">
                        {members.slice(0, 3).map((member) => (
                          <Avatar key={member.id} className="h-6 w-6 border-2 border-background ring-1 ring-border/20 shadow-sm transition-transform group-hover:scale-110">
                            <AvatarImage src={member.avatar || undefined} alt={member.name} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[8px] font-bold">{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium border-2 border-background ring-1 ring-border/20 z-10">
                            +{members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={project.stats?.progress || 0} className="h-2 flex-1 bg-muted/50" />
                      <span className="text-xs font-bold text-muted-foreground w-9 text-right tabular-nums">
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
