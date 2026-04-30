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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

interface ChangeRoleDialogProps {
    user: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onRoleChanged?: () => void
}

export function ChangeRoleDialog({ user, open, onOpenChange, onRoleChanged }: ChangeRoleDialogProps) {
    const [role, setRole] = useState(user?.role || "ENGINEER")
    const [isLoading, setIsLoading] = useState(false)
    const { isAuthenticated, isSuperAdmin, isAdmin } = useAuth()

    // Update internal state when user prop changes
    if (user && role !== user.role && !open) {
        // Only update if dialog is closed to avoid overriding user's unsaved selection
        setRole(user.role)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        if (role === user.role) {
            onOpenChange(false)
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ role }),
            })

            const data = await res.json()

            if (!res.ok) {
                toast.error("Failed to change role", {
                    description: data.error || "An error occurred",
                })
                return
            }

            toast.success("Role updated successfully", {
                description: `${user.name} is now a ${role}.`,
            })

            onOpenChange(false)
            onRoleChanged?.()
        } catch (error: any) {
            toast.error("Error updating role", {
                description: error.message,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                                <ShieldAlert className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            Change User Role
                        </DialogTitle>
                        <DialogDescription>
                            Update role and permissions for {user?.name}. Note that changing a role immediately affects their access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 border p-3 rounded-lg bg-muted/40 text-sm">
                                <span className="text-muted-foreground w-20">Current:</span>
                                <span className="font-semibold">{user?.role}</span>
                            </div>

                            <div className="space-y-2 relative z-50">
                                <label className="text-sm font-medium">New Role</label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a new role" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[100] relative">
                                        {isSuperAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                                        <SelectItem value="MANAGER">Manager</SelectItem>
                                        <SelectItem value="ENGINEER">Engineer</SelectItem>
                                        <SelectItem value="DESIGNER">Designer</SelectItem>
                                        <SelectItem value="RESEARCHER">Researcher</SelectItem>
                                        <SelectItem value="VIEWER">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                                {!isSuperAdmin && isAdmin && (
                                    <p className="text-xs text-muted-foreground pt-1 text-orange-600/80">
                                        Only Super Admins can promote users to Admin level.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                            disabled={isLoading || role === user?.role}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
