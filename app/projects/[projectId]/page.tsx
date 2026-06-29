"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectKanbanBoard } from "@/components/projects/project-kanban-board"
import { ProjectWorkspaceSheets } from "@/components/projects/project-workspace-sheets"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface BoardProject {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string
      email: string
      role: string
      avatar: string | null
      userKind?: string
    }
  }>
  board: {
    id: string
    title: string
    columns: any[]
  } | null
}

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<BoardProject | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, isClientUser } = useAuth()

  const loadProject = useCallback(() => {
    if (!projectId) return
    setLoading(true)
    fetch(`/api/projects/${projectId}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.project) {
          setProject(data.project)
        } else {
          setProject(null)
          toast.error("Project not found")
        }
      })
      .catch(() => toast.error("Failed to load project"))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject, isAuthenticated])

  const statusColor =
    project?.status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800"
      : project?.status === "COMPLETED"
        ? "bg-blue-100 text-blue-800"
        : project?.status === "ARCHIVED"
          ? "bg-muted text-muted-foreground"
          : "bg-gray-100 text-gray-800"

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <DashboardHeader />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6 pt-6">
        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-4 w-96" />
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-[300px] flex-shrink-0">
                  <Skeleton className="h-12 w-full rounded-t-xl" />
                  <Skeleton className="h-[500px] w-full rounded-b-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : project ? (
          <>
            {/* Project header */}
            <div className="mb-4 shrink-0 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href={isClientUser ? "/client" : "/projects"}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {isClientUser ? "My projects" : "Projects"}
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">{project.name}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                    <Badge variant="secondary" className={`text-xs ${statusColor}`}>
                      {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-muted-foreground text-sm max-w-2xl">{project.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {/* Team members */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 4).map(m => (
                        <Avatar key={m.id} className="h-7 w-7 border-2 border-background" title={m.user.name}>
                          <AvatarImage src={m.user.avatar || undefined} />
                          <AvatarFallback className="text-[10px]">{m.user.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                      {project.members.length > 4 && (
                        <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                    <span>{project.members.length} members</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 shrink-0">
              <ProjectWorkspaceSheets
                projectId={project.id}
                members={project.members}
                onTeamChange={loadProject}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <ProjectKanbanBoard projectId={project.id} readOnly={isClientUser} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Project not found</h2>
              <p className="text-muted-foreground mt-2">
                The project you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/projects">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
