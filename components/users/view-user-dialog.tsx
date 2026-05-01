"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Camera, UserSquare2, ShieldCheck, Shield, Clock, TicketIcon, Save } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"

interface ViewUserDialogProps {
    userId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUpdate?: () => void
}

export function ViewUserDialog({ userId, open, onOpenChange, onUpdate }: ViewUserDialogProps) {
    const [userData, setUserData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Edit states
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { isAuthenticated, user: currentUser, isAdmin, isSuperAdmin } = useAuth()

    useEffect(() => {
        if (open && userId) {
            setIsLoading(true)
            setIsEditing(false)
            fetch(`/api/users/${userId}`, {
                credentials: 'include',
            })
                .then(r => r.json())
                .then(data => {
                    if (data.user) {
                        setUserData(data.user)
                        setEditName(data.user.name)
                    } else {
                        toast.error(data.error || "Failed to load user")
                    }
                })
                .catch(() => toast.error("Error loading profile"))
                .finally(() => setIsLoading(false))
        } else {
            setUserData(null)
        }
    }, [open, userId, isAuthenticated])

    if (!userId) return null

    const canEditProfile = currentUser?.id === userId || isAdmin || isSuperAdmin

    const handleSaveProfile = async () => {
        if (!editName.trim()) return

        setIsSaving(true)
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ name: editName.trim() }),
            })
            const data = await res.json()
            if (res.ok) {
                toast.success("Profile updated successfully")
                setUserData({ ...userData, name: editName.trim() })
                setIsEditing(false)
                onUpdate?.()
            } else {
                toast.error(data.error || "Failed to update profile")
            }
        } catch (e) {
            toast.error("Error updating profile")
        } finally {
            setIsSaving(false)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // 1. Upload file
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST',
                credentials: 'include',
                body: file,
            })

            if (!uploadRes.ok) throw new Error("Upload failed")

            const blob = await uploadRes.json()

            // 2. Save avatar URL to user
            const avatarUrl = blob.url
            const patchRes = await fetch(`/api/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ avatar: avatarUrl }),
            })

            if (patchRes.ok) {
                toast.success("Profile picture updated")
                setUserData({ ...userData, avatar: avatarUrl })
                onUpdate?.()
            } else {
                throw new Error("Failed to save avatar")
            }
        } catch (e: any) {
            toast.error(e.message || "Error updating profile picture")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role?.toUpperCase()) {
            case "SUPER_ADMIN": return "bg-gradient-to-r from-[#6554C0] to-[#403294] text-white border-0"
            case "ADMIN": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            case "MANAGER": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
            case "ENGINEER": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            case "DESIGNER": return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
            case "RESEARCHER": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            case "VIEWER": return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role?.toUpperCase()) {
            case "SUPER_ADMIN": return <ShieldCheck className="h-3 w-3 mr-1" />
            case "ADMIN": return <Shield className="h-3 w-3 mr-1" />
            default: return null
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card p-0 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 w-full" />

                {isLoading || !userData ? (
                    <div className="flex h-[300px] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="px-6 pb-6 relative -mt-16">
                        <div className="flex justify-between items-end mb-4">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 border-4 border-card bg-card shadow-sm">
                                    <AvatarImage src={userData.avatar} alt={userData.name} className="object-cover" />
                                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                                        {userData.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                {canEditProfile && (
                                    <>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 p-1.5 bg-background border rounded-full shadow-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors z-10"
                                            disabled={isUploading}
                                        >
                                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                        </button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                        />
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={getRoleBadgeColor(userData.role)} variant="secondary">
                                    {getRoleIcon(userData.role)}
                                    {userData.role.replace('_', ' ')}
                                </Badge>
                                <Badge variant={userData.status === 'ACTIVE' ? 'default' : userData.status === 'PENDING' ? 'secondary' : 'destructive'}
                                    className={userData.status === 'ACTIVE' ? "bg-green-500 hover:bg-green-600" : ""}>
                                    {userData.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="mb-6">
                            {isEditing ? (
                                <div className="flex items-center gap-2 max-w-xs">
                                    <Input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="h-8 py-1"
                                        autoFocus
                                    />
                                    <Button size="sm" className="h-8 px-2" onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setIsEditing(false); setEditName(userData.name) }}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold">{userData.name}</h2>
                                    {canEditProfile && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-50 hover:opacity-100" onClick={() => setIsEditing(true)}>
                                            <UserSquare2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                            <p className="text-muted-foreground text-sm">{userData.email}</p>

                            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    Joined {new Date(userData.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className={`h-2 w-2 rounded-full ${userData.lastActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    {userData.lastActive ? `Active ${formatDistanceToNow(new Date(userData.lastActive))} ago` : 'Never logged in'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {/* Assigned Tickets */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <TicketIcon className="h-4 w-4 text-muted-foreground" />
                                    Recent Tickets
                                </h3>
                                {userData.assignedTickets?.length > 0 ? (
                                    <div className="space-y-2">
                                        {userData.assignedTickets.map((t: any) => (
                                            <Card key={t.id} className="p-3 bg-muted/40 shadow-none border-dashed">
                                                <p className="text-sm font-medium line-clamp-1">{t.title}</p>
                                                <div className="flex justify-between items-center mt-2">
                                                    <Badge variant="outline" className="text-[10px]">{t.column?.title || 'Unknown'}</Badge>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{t.priority}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground p-4 text-center border rounded-lg border-dashed">No assigned tickets.</p>
                                )}
                            </div>

                            {/* Recent Activity */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    Recent Activity
                                </h3>
                                {userData.activityLogs?.length > 0 ? (
                                    <div className="space-y-0 relative before:absolute before:inset-y-0 before:left-1.5 before:w-px before:bg-border pl-4">
                                        {userData.activityLogs.map((log: any) => (
                                            <div key={log.id} className="relative py-2 text-sm">
                                                <div className="absolute left-[-16px] top-[14px] w-1.5 h-1.5 rounded-full bg-blue-500 ring-2 ring-background" />
                                                <p className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(log.createdAt))} ago</p>
                                                <p className="font-medium text-sm leading-tight mt-0.5">{log.details}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground p-4 text-center border rounded-lg border-dashed">No recent activity.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
