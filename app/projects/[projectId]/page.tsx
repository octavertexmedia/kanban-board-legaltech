"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectKanbanBoard } from "@/components/projects/project-kanban-board"
import { ProjectWorkspaceSheets } from "@/components/projects/project-workspace-sheets"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
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
      credentials: "include",
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
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-3 md:px-4 md:pb-4">
        {loading ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <Skeleton className="h-10 w-full max-w-lg" />
            <Skeleton className="min-h-0 flex-1 w-full rounded-lg" />
          </div>
        ) : project ? (
          <>
            {/* Compact Jira-style project bar */}
            <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Link
                  href={isClientUser ? "/client" : "/projects"}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {isClientUser ? "Projects" : "All projects"}
                </Link>
                <span className="text-muted-foreground/50">/</span>
                <h1 className="truncate text-base font-semibold tracking-tight">{project.name}</h1>
                <Badge variant="secondary" className={`h-5 text-[10px] ${statusColor}`}>
                  {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                </Badge>
              </div>
              <ProjectWorkspaceSheets
                projectId={project.id}
                members={project.members}
                onTeamChange={loadProject}
              />
            </div>

            {project.description ? (
              <p className="mb-2 line-clamp-1 shrink-0 text-xs text-muted-foreground">
                {project.description}
              </p>
            ) : null}

            <div className="min-h-0 flex-1 overflow-hidden">
              <ProjectKanbanBoard
                projectId={project.id}
                projectName={project.name}
                readOnly={isClientUser}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-bold">Project not found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The project you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Button asChild className="mt-4" variant="outline" size="sm">
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
