"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Archive, MoreHorizontal, Trash2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface ProjectAdminActionsProps {
    projectId: string
    name: string
    status: string
    onChanged?: () => void
}

export function ProjectAdminActions({
    projectId,
    name,
    status,
    onChanged,
}: ProjectAdminActionsProps) {
    const router = useRouter()
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [busy, setBusy] = useState<string | null>(null)

    const patchStatus = async (next: "ARCHIVED" | "ACTIVE") => {
        setBusy(next)
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: next }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Update failed")
            toast.success(
                next === "ARCHIVED" ? "Project archived" : "Project restored",
            )
            onChanged?.()
            router.refresh()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Update failed")
        } finally {
            setBusy(null)
        }
    }

    const deleteProject = async () => {
        setBusy("delete")
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
                credentials: "include",
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Delete failed")
            toast.success("Project deleted")
            setDeleteOpen(false)
            onChanged?.()
            router.push("/projects")
            router.refresh()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Delete failed")
        } finally {
            setBusy(null)
        }
    }

    const isArchived = status === "ARCHIVED"

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => e.preventDefault()}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Project actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {!isArchived ? (
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault()
                                void patchStatus("ARCHIVED")
                            }}
                            disabled={!!busy}
                        >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem
                            onSelect={(e) => {
                                e.preventDefault()
                                void patchStatus("ACTIVE")
                            }}
                            disabled={!!busy}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => {
                            e.preventDefault()
                            setDeleteOpen(true)
                        }}
                        disabled={!!busy}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete…
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete project?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This permanently deletes{" "}
                            <strong>{name}</strong> and its board, tickets, and
                            activity. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={busy === "delete"}>
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={busy === "delete"}
                            onClick={() => void deleteProject()}
                        >
                            {busy === "delete" ? "Deleting…" : "Delete project"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
