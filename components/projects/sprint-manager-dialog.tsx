"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

export interface DBSprint {
  id: string
  name: string
  goal: string | null
  startDate: string
  endDate: string
  status: "PLANNED" | "ACTIVE" | "COMPLETED"
  _count?: { tickets: number }
}

interface SprintManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  sprints: DBSprint[]
  onSprintsChange: (sprints: DBSprint[]) => void
}

export function SprintManagerDialog({
  open,
  onOpenChange,
  projectId,
  sprints,
  onSprintsChange,
}: SprintManagerDialogProps) {
  const [name, setName] = useState("")
  const [goal, setGoal] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [saving, setSaving] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          goal: goal.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create sprint")
      onSprintsChange([data.sprint, ...sprints])
      setName("")
      setGoal("")
      setStartDate("")
      setEndDate("")
      toast.success("Sprint created")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed")
    } finally {
      setSaving(false)
    }
  }

  const patchSprint = async (sprintId: string, status: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints/${sprintId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Update failed")
      const next = sprints.map((s) => {
        if (status === "ACTIVE" && s.status === "ACTIVE" && s.id !== sprintId) {
          return { ...s, status: "PLANNED" as const }
        }
        return s.id === sprintId ? data.sprint : s
      })
      onSprintsChange(next)
      toast.success(`Sprint ${status === "ACTIVE" ? "started" : "completed"}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Sprints</DialogTitle>
          <DialogDescription className="text-xs">
            Plan iterations and filter the board by sprint.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-3 border rounded-md p-3">
          <div className="grid gap-2">
            <Label htmlFor="sprint-name" className="text-xs">
              New sprint name
            </Label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 1"
              className="h-8 text-xs"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Start</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">End</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Goal (optional)</Label>
            <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="min-h-[60px] text-xs" />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs" disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Create sprint
          </Button>
        </form>

        <div className="space-y-2 max-h-[240px] overflow-y-auto">
          {sprints.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No sprints yet.</p>
          ) : (
            sprints.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-2 border rounded-md p-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium truncate">{s.name}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      {s.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{s._count?.tickets ?? 0} tickets</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(s.startDate), "MMM d")} – {format(new Date(s.endDate), "MMM d, yyyy")}
                  </p>
                  {s.goal ? <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{s.goal}</p> : null}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {s.status !== "ACTIVE" && s.status !== "COMPLETED" && (
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => patchSprint(s.id, "ACTIVE")}>
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                  {s.status === "ACTIVE" && (
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => patchSprint(s.id, "COMPLETED")}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
