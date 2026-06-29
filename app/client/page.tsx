"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { FolderKanban, ArrowRight } from "lucide-react"

interface ProjectCard {
  id: string
  name: string
  description: string | null
  status: string
  stats?: { progress?: number; totalTickets?: number }
}

export default function ClientPortalPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch("/api/projects", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.projects) setProjects(data.projects)
        else if (data.error) toast.error(data.error)
      })
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false))
  }, [isAuthenticated, isLoading])

  if (isLoading || loading) {
    return (
      <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </main>
    )
  }

  return (
    <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your projects</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track delivery status and updates shared by the OctaVertex team.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            You are not assigned to any project yet. Your account manager will link you when your
            engagement is ready.
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/client/projects/${p.id}`}>
                <Card className="transition-colors hover:border-primary/40 hover:bg-muted/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderKanban className="h-5 w-5 shrink-0 text-primary" />
                        <CardTitle className="text-lg truncate">{p.name}</CardTitle>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    {p.description && (
                      <CardDescription className="line-clamp-2">{p.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-3 text-sm">
                    <Badge variant="secondary">{p.status}</Badge>
                    {typeof p.stats?.progress === "number" && (
                      <span className="text-muted-foreground">
                        Board progress: {p.stats.progress}%
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
