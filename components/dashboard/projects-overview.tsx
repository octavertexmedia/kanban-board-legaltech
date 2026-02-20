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
  const { token } = useAuth()

  useEffect(() => {
    fetch("/api/projects?limit=3", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => setProjects((data.projects || []).slice(0, 3)))
      .catch(() => { })
      .finally(() => setIsLoading(false))
  }, [token])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Active Projects</CardTitle>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="gap-1">
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No active projects</p>
            <Link href="/projects">
              <Button variant="outline" size="sm" className="mt-2">Create Project</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const statusColor =
                project.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                  project.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
              const statusLabel = project.status.charAt(0) + project.status.slice(1).toLowerCase()
              const members = project.members?.map(m => m.user) || []

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="space-y-2 group hover:bg-muted/30 rounded-lg px-2 py-1.5 -mx-2 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </div>
                        <Badge variant="outline" className={`text-xs shrink-0 ${statusColor}`}>
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="flex -space-x-1.5 shrink-0">
                        {members.slice(0, 3).map((member) => (
                          <Avatar key={member.id} className="h-5 w-5 border-2 border-background">
                            <AvatarImage src={member.avatar || undefined} alt={member.name} />
                            <AvatarFallback className="text-[8px]">{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 3 && (
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] border-2 border-background">
                            +{members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={project.stats?.progress || 0} className="h-1.5 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground w-8 text-right">
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
