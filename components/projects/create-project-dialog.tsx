"use client"

import { useState, useEffect } from "react"
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
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import type { DBProject } from "./projects-list"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreate?: (project: DBProject) => void
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

export function CreateProjectDialog({ open, onOpenChange, onProjectCreate }: CreateProjectDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [allUsers, setAllUsers] = useState<TeamMember[]>([])
  const { token } = useAuth()

  // Fetch users when dialog opens
  useEffect(() => {
    if (open && allUsers.length === 0) {
      fetch("/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(data => setAllUsers(data.users || []))
        .catch(() => { })
    }
  }, [open, token, allUsers.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsLoading(true)

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          memberIds: selectedMemberIds,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create project")

      if (onProjectCreate) {
        onProjectCreate(data.project)
      }
      toast.success("Project created!", { description: `"${name}" is live.` })

      // Reset form
      setName("")
      setDescription("")
      setSelectedMemberIds([])
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Failed to create project", { description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Create a new project for your team to work on.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="proj-name" className="text-right">Name</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Website Redesign"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="proj-desc" className="text-right">Description</Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={3}
                placeholder="What's this project about?"
              />
            </div>
            {allUsers.length > 0 && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Team Members</Label>
                <div className="col-span-3 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {allUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded px-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(u.id)}
                        onChange={() => toggleMember(u.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{u.name}</span>
                      <span className="text-xs text-muted-foreground capitalize ml-auto">{u.role.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2962FF] hover:bg-[#2962FF]/90" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
