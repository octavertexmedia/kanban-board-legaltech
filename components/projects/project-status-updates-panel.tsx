"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

interface UpdateRow {
  id: string
  title: string
  body: string
  visibility: string
  createdAt: string
  author: { id: string; name: string; avatar: string | null }
}

export function ProjectStatusUpdatesPanel({
  projectId,
  readOnly = false,
}: {
  projectId: string
  readOnly?: boolean
}) {
  const { token, isClientUser } = useAuth()
  const [updates, setUpdates] = useState<UpdateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [visibility, setVisibility] = useState<"CLIENT" | "INTERNAL">("CLIENT")

  const headers = useCallback((): HeadersInit => {
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }, [token])

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/status-updates`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load updates")
      setUpdates(data.updates || [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, token])

  useEffect(() => {
    load()
  }, [load])

  const publish = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/status-updates`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ title: title.trim(), body: body.trim(), visibility }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to publish")
      setUpdates((u) => [data.update, ...u])
      setTitle("")
      setBody("")
      toast.success("Update published")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const showComposer = !readOnly && !isClientUser

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Project status updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {showComposer && (
          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">
              Share progress with your team (internal) or publish to the client portal.
            </p>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea
              placeholder="What changed? Milestones, risks, next steps…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select value={visibility} onValueChange={(v) => setVisibility(v as "CLIENT" | "INTERNAL")}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT">Visible to client</SelectItem>
                  <SelectItem value="INTERNAL">Internal only</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={publish} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish update"}
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : updates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No status updates yet.</p>
        ) : (
          <ul className="space-y-4">
            {updates.map((u) => (
              <li
                key={u.id}
                className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <span className="font-semibold">{u.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {u.visibility === "CLIENT" ? "Client-visible" : "Internal"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">By {u.author.name}</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{u.body}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
