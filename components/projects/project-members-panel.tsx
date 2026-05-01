"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { UserPlus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

type MemberRow = {
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
}

type ApiUser = {
    id: string
    name: string
    email: string
    role: string
    userKind?: string
}

interface ProjectMembersPanelProps {
    projectId: string
    members: MemberRow[]
    onMembersChange: () => void
}

export function ProjectMembersPanel({
    projectId,
    members,
    onMembersChange,
}: ProjectMembersPanelProps) {
    const { isManager, user: me } = useAuth()
    const [open, setOpen] = useState(false)
    const [directory, setDirectory] = useState<ApiUser[]>([])
    const [loadingDir, setLoadingDir] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string>("")
    const [seatRole, setSeatRole] = useState<"MEMBER" | "CLIENT">("MEMBER")
    const [submitting, setSubmitting] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)

    const memberUserIds = useMemo(
        () => new Set(members.map((m) => m.user.id)),
        [members],
    )

    const loadDirectory = useCallback(async () => {
        setLoadingDir(true)
        try {
            const res = await fetch("/api/users", { credentials: "include" })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to load users")
            setDirectory(data.users || [])
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to load users")
        } finally {
            setLoadingDir(false)
        }
    }, [])

    useEffect(() => {
        if (open) void loadDirectory()
    }, [open, loadDirectory])

    const addableUsers = useMemo(() => {
        const free = directory.filter((u) => !memberUserIds.has(u.id))
        if (seatRole === "CLIENT") {
            return free.filter((u) => u.userKind === "CLIENT")
        }
        return free.filter((u) => u.userKind !== "CLIENT")
    }, [directory, memberUserIds, seatRole])

    const addMember = async () => {
        if (!selectedUserId) {
            toast.error("Choose a user to add")
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch(`/api/projects/${projectId}/members`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUserId, role: seatRole }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Could not add member")
            toast.success("Member added")
            setOpen(false)
            setSelectedUserId("")
            setSeatRole("MEMBER")
            onMembersChange()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Could not add member")
        } finally {
            setSubmitting(false)
        }
    }

    const removeMember = async (member: MemberRow) => {
        setRemovingId(member.id)
        try {
            const res = await fetch(
                `/api/projects/${projectId}/members/${member.user.id}`,
                { method: "DELETE", credentials: "include" },
            )
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Could not remove member")
            toast.success("Removed from project")
            onMembersChange()
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Could not remove member")
        } finally {
            setRemovingId(null)
        }
    }

    if (!isManager) return null

    return (
        <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-base">Project team</CardTitle>
                    <CardDescription>
                        Add or remove people on this project. Owners cannot be removed if they are the only owner.
                    </CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <UserPlus className="h-4 w-4 mr-1.5" />
                            Add member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add project member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>User</Label>
                                {loadingDir ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading directory…
                                    </div>
                                ) : addableUsers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No users match this seat type.
                                    </p>
                                ) : (
                                    <Select
                                        value={selectedUserId}
                                        onValueChange={setSelectedUserId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {addableUsers.map((u) => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.name} ({u.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Seat</Label>
                                <Select
                                    value={seatRole}
                                    onValueChange={(v) => {
                                        setSeatRole(v as "MEMBER" | "CLIENT")
                                        setSelectedUserId("")
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MEMBER">
                                            Team member (internal)
                                        </SelectItem>
                                        <SelectItem value="CLIENT">
                                            Client portal
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={() => void addMember()} disabled={submitting}>
                                {submitting && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Add
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <ul className="divide-y rounded-md border">
                    {members.map((m) => {
                        const isSelf = me?.id === m.user.id
                        return (
                            <li
                                key={m.id}
                                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                            >
                                <div>
                                    <span className="font-medium">{m.user.name}</span>
                                    <span className="text-muted-foreground">
                                        {" "}
                                        · {m.user.email}
                                    </span>
                                    <span className="ml-2 text-xs uppercase text-muted-foreground">
                                        {m.role}
                                    </span>
                                    {isSelf && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            (you)
                                        </span>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    title="Remove from project"
                                    disabled={removingId === m.id}
                                    onClick={() => void removeMember(m)}
                                >
                                    {removingId === m.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </li>
                        )
                    })}
                </ul>
            </CardContent>
        </Card>
    )
}
