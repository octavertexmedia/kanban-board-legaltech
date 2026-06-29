"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ProjectKanbanBoard } from "@/components/projects/project-kanban-board"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar } from "lucide-react"
import { toast } from "sonner"

interface ClientProject {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
}

export default function ClientProjectPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<ClientProject | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProject = useCallback(() => {
    if (!projectId) return
    setLoading(true)
    fetch(`/api/projects/${projectId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.project) setProject(data.project)
        else {
          setProject(null)
          toast.error(data.error || "Project not found")
        }
      })
      .catch(() => toast.error("Failed to load project"))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  const statusColor =
    project?.status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800"
      : project?.status === "COMPLETED"
        ? "bg-blue-100 text-blue-800"
        : "bg-muted text-muted-foreground"

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      ) : project ? (
        <>
          <div className="mb-4 shrink-0 space-y-2">
            <Link
              href="/client"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              My projects
            </Link>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
                  <Badge variant="secondary" className={`text-xs ${statusColor}`}>
                    {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                {project.description ? (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Started{" "}
                {new Date(project.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <ProjectKanbanBoard projectId={project.id} readOnly />
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold">Project not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This project is not available on your account.
            </p>
            <Button asChild className="mt-4" variant="outline" size="sm">
              <Link href="/client">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My projects
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
