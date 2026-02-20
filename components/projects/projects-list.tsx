"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Loader2, RefreshCw } from "lucide-react"
import { ProjectCard } from "@/components/projects/project-card"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export interface DBProject {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
  members: Array<{
    id: string
    role: string
    user: { id: string; name: string; email: string; role: string; avatar: string | null }
  }>
  board: {
    id: string
    title: string
    columns: Array<{ id: string; title: string; position: number; _count: { tickets: number } }>
  } | null
  stats: {
    totalTickets: number
    doneTickets: number
    progress: number
    memberCount: number
  }
}

export function ProjectsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [projects, setProjects] = useState<DBProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      const res = await fetch(`/api/projects?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load projects")
      setProjects(data.projects || [])
    } catch (err: any) {
      setError(err.message)
      toast.error("Failed to load projects", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }, [token, searchQuery])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleProjectCreated = (newProject: DBProject) => {
    setProjects(prev => [newProject, ...prev])
    toast.success("Project created!", { description: `"${newProject.name}" is ready.` })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your team's projects and track progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchProjects} className="h-9 w-9" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-[#2962FF] hover:bg-[#2962FF]/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      </div>

      <div className="flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" onClick={fetchProjects} className="mt-3">
              Try Again
            </Button>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h3 className="text-lg font-semibold">No projects found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery ? "No projects match your search." : "Create your first project to get started."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)} className="mt-4 bg-[#2962FF] hover:bg-[#2962FF]/90">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onProjectCreate={handleProjectCreated}
      />
    </div>
  )
}
