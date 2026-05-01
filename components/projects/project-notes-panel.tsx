"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { renderNoteBodyWithMentions } from "@/lib/project-note-mentions"

type MemberLite = { user: { id: string; name: string; email: string } }

type NoteRow = {
    id: string
    body: string
    createdAt: string
    author: { id: string; name: string; email: string; avatar: string | null }
}

export function ProjectNotesPanel({
    projectId,
    members,
}: {
    projectId: string
    members: MemberLite[]
}) {
    const [notes, setNotes] = useState<NoteRow[]>([])
    const [loading, setLoading] = useState(true)
    const [body, setBody] = useState("")
    const [saving, setSaving] = useState(false)
    const taRef = useRef<HTMLTextAreaElement>(null)

    const mentionTargets = useMemo(
        () =>
            members.map((m) => ({
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
            })),
        [members],
    )

    const load = useCallback(async () => {
        if (!projectId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/notes`, {
                credentials: "include",
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to load notes")
            setNotes(data.notes || [])
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to load notes")
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        void load()
    }, [load])

    const insertMention = (email: string) => {
        const token = `@${email} `
        const el = taRef.current
        if (el && typeof el.selectionStart === "number") {
            const start = el.selectionStart
            const end = el.selectionEnd
            const next =
                body.slice(0, start) + token + body.slice(end ?? start)
            setBody(next)
            requestAnimationFrame(() => {
                el.focus()
                const pos = start + token.length
                el.setSelectionRange(pos, pos)
            })
        } else {
            setBody((b) => (b ? `${b} ${token}` : token))
        }
    }

    const submit = async () => {
        const t = body.trim()
        if (!t) {
            toast.error("Write a note first")
            return
        }
        setSaving(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/notes`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: t }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Could not post note")
            setNotes((n) => [data.note, ...n])
            setBody("")
            toast.success("Note added")
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Could not post note")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Internal notes for this project. Type{" "}
                <code className="text-xs bg-muted px-1 rounded">@email</code> or
                use the chips below to mention someone on the team.
            </p>

            {mentionTargets.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {mentionTargets.map((m) => (
                        <Button
                            key={m.id}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs font-normal"
                            onClick={() => insertMention(m.email)}
                        >
                            @{m.name.split(" ")[0]}
                        </Button>
                    ))}
                </div>
            )}

            <Textarea
                ref={taRef}
                placeholder="Decisions, risks, links… Use @someone@company.com to mention them."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[120px] text-sm"
            />
            <Button type="button" onClick={() => void submit()} disabled={saving}>
                {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                    <Send className="h-4 w-4 mr-2" />
                )}
                Post note
            </Button>

            <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-medium">Thread</h4>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No notes yet.</p>
                ) : (
                    <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                        {notes.map((n) => (
                            <li
                                key={n.id}
                                className="rounded-lg border bg-card/40 p-3 text-sm space-y-1"
                            >
                                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                        {n.author.name}
                                    </span>
                                    <span>
                                        {new Date(n.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div className="whitespace-pre-wrap leading-relaxed">
                                    {renderNoteBodyWithMentions(n.body)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
