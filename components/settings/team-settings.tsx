"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Plus, MoreHorizontal, Mail, Crown, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { InviteUserDialog } from "@/components/users/invite-user-dialog"
import { toast } from "sonner"

type ListedUser = {
  id: string
  name: string
  email: string
  role: string
  userKind: string
  status: string
  avatar: string | null
}

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-3 w-3 text-amber-500" />,
  admin: <Crown className="h-3 w-3 text-amber-500" />,
  manager: <Shield className="h-3 w-3 text-blue-500" />,
}

const roleBadgeColors: Record<string, string> = {
  super_admin:
    "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  admin:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  manager:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  engineer:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  designer:
    "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  researcher:
    "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  viewer:
    "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  member:
    "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
}

function formatRoleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function roleKey(role: string) {
  return role.toLowerCase()
}

export function TeamSettings() {
  const { isAuthenticated, isLoading: authLoading, isClientUser, isAdmin, isSuperAdmin, user } =
    useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<ListedUser[]>([])

  const loadMembers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/users", { credentials: "include" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load team")
      }
      const data = await res.json()
      setMembers(data.users ?? [])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load team"
      toast.error(msg)
      setMembers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated && !isClientUser) void loadMembers()
  }, [authLoading, isAuthenticated, isClientUser, loadMembers])

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const canManageRoles = isAdmin || isSuperAdmin
  const canRemove = isSuperAdmin

  const handleRoleChange = async (userId: string, newRole: string) => {
    const role = newRole.toUpperCase()
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not update role")
      toast.success("Role updated")
      await loadMembers()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update role")
    }
  }

  const handleRemoveMember = async (target: ListedUser) => {
    if (!canRemove) return
    if (target.id === user?.id) {
      toast.error("You cannot delete your own account here.")
      return
    }
    if (
      !window.confirm(
        `Remove ${target.name} from the workspace? This cannot be undone.`,
      )
    ) {
      return
    }
    try {
      const res = await fetch(`/api/users/${target.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not remove user")
      toast.success("User removed")
      await loadMembers()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not remove user")
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-muted-foreground py-8">Sign in to view team settings.</p>
    )
  }

  if (isClientUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>
            Client portal accounts cannot list or invite workspace members. Use the internal app for
            team management.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30">
              <Mail className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle>Team members</CardTitle>
              <CardDescription>
                People in this workspace (from the database). Inviting creates a Neon Auth user and a
                profile with the role you choose.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, email, or role…"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {canManageRoles && (
              <Button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                Invite member
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading members…
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-5 md:col-span-4">Member</div>
                <div className="col-span-5 md:col-span-4 hidden md:block">Email</div>
                <div className="col-span-4 md:col-span-2">Role</div>
                <div className="col-span-3 md:col-span-2">Actions</div>
              </div>

              {filtered.length > 0 ? (
                <div className="divide-y">
                  {filtered.map((member) => {
                    const rk = roleKey(member.role)
                    const isTargetSuper = member.role === "SUPER_ADMIN"
                    const showMenu = canManageRoles && !isTargetSuper

                    return (
                      <div
                        key={member.id}
                        className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors"
                      >
                        <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                          <Avatar className="h-9 w-9 ring-2 ring-background">
                            <AvatarImage
                              src={member.avatar || "/placeholder.svg"}
                              alt={member.name}
                            />
                            <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm flex items-center gap-1.5">
                              {member.name}
                              {roleIcons[rk]}
                            </div>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {member.email}
                            </div>
                            {member.userKind === "CLIENT" && (
                              <Badge variant="outline" className="mt-1 text-[10px]">
                                Client portal
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="col-span-5 md:col-span-4 hidden md:block text-sm text-muted-foreground">
                          {member.email}
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${roleBadgeColors[rk] || roleBadgeColors.member}`}
                          >
                            {formatRoleLabel(member.role)}
                          </Badge>
                          {member.status === "INACTIVE" && (
                            <span className="ml-2 text-[10px] text-muted-foreground">Inactive</span>
                          )}
                        </div>

                        <div className="col-span-3 md:col-span-2 flex items-center gap-2">
                          {showMenu ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isSuperAdmin && (
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(member.id, "ADMIN")}
                                  >
                                    Make admin
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(member.id, "MANAGER")}
                                >
                                  Make manager
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(member.id, "ENGINEER")}
                                >
                                  Make engineer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(member.id, "DESIGNER")}
                                >
                                  Make designer
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(member.id, "RESEARCHER")}
                                >
                                  Make researcher
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(member.id, "VIEWER")}
                                >
                                  Make viewer
                                </DropdownMenuItem>
                                {canRemove && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => void handleRemoveMember(member)}
                                    >
                                      Remove user
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No members match your search.
                </div>
              )}
            </div>
          )}

          {!canManageRoles && (
            <p className="text-xs text-muted-foreground">
              Only admins can invite users or change roles. You can still view the directory.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Workspace name, domain, and billing are not configured in this screen yet. They are set
            by your deployment and branding (see app layout and environment).
          </CardDescription>
        </CardHeader>
      </Card>

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onUserCreated={() => void loadMembers()}
      />
    </div>
  )
}
