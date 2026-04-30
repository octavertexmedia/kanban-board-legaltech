"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertTriangle, UserMinus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

interface ConfirmUserActionDialogProps {
    user: any | null
    action: "deactivate" | "activate" | "delete" | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirmed?: () => void
    allUsers?: any[]
}

export function ConfirmUserActionDialog({
    user,
    action,
    open,
    onOpenChange,
    onConfirmed,
    allUsers = [],
}: ConfirmUserActionDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [reassignTo, setReassignTo] = useState<string>("none")
    const { isAuthenticated } = useAuth()

    if (!user || !action) return null

    const isDestructive = action === "deactivate" || action === "delete"
    const eligibleUsers = allUsers.filter(u => u.id !== user.id && u.status === "ACTIVE")

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            if (action === "delete") {
                // If reassigning tickets, do that first
                if (reassignTo && reassignTo !== "none") {
                    await fetch(`/api/tickets/reassign`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({ fromUserId: user.id, toUserId: reassignTo }),
                    })
                }

                const res = await fetch(`/api/users/${user.id}`, {
                    method: "DELETE",
                    credentials: 'include',
                })
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Failed to delete user")
                }
                toast.success("User deleted successfully", {
                    description: `${user.name} has been permanently removed.`,
                })
            } else {
                const newStatus = action === "deactivate" ? "INACTIVE" : "ACTIVE"

                // If deactivating and reassigning tickets
                if (action === "deactivate" && reassignTo && reassignTo !== "none") {
                    await fetch(`/api/tickets/reassign`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({ fromUserId: user.id, toUserId: reassignTo }),
                    })
                }

                const res = await fetch(`/api/users/${user.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ status: newStatus }),
                })
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || "Failed to update user")
                }
                toast.success(
                    action === "deactivate" ? "User deactivated" : "User activated",
                    { description: `${user.name} has been ${action}d.` }
                )
            }

            onOpenChange(false)
            onConfirmed?.()
        } catch (err: any) {
            toast.error(err.message || "Action failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isDestructive ? 'bg-red-50 dark:bg-red-950/30' : 'bg-green-50 dark:bg-green-950/30'}`}>
                            {isDestructive
                                ? <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                : <UserMinus className="h-4 w-4 text-green-600 dark:text-green-400" />
                            }
                        </div>
                        {action === "delete"
                            ? "Delete User Permanently"
                            : action === "deactivate"
                                ? "Deactivate User Account"
                                : "Activate User Account"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <span className="block">
                            {action === "delete"
                                ? `This will permanently remove ${user.name} (${user.email}) from the system. This action cannot be undone!`
                                : action === "deactivate"
                                    ? `${user.name} (${user.email}) will be blocked from logging in. Their existing data will be preserved.`
                                    : `${user.name} (${user.email}) will be able to log in again.`}
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {isDestructive && eligibleUsers.length > 0 && (
                    <div className="space-y-2 py-2">
                        <label className="text-sm font-medium">Re-assign pending tickets to:</label>
                        <Select value={reassignTo} onValueChange={setReassignTo}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Don't re-assign" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Don&apos;t re-assign (leave unassigned)</SelectItem>
                                {eligibleUsers.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            All tickets currently assigned to {user.name} will be transferred.
                        </p>
                    </div>
                )}

                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant={isDestructive ? "destructive" : "default"}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            action === "delete" ? "Delete Permanently" : action === "deactivate" ? "Deactivate" : "Activate"
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
