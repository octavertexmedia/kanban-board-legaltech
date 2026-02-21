"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Search, Loader2, ShieldCheck, Shield, ShieldAlert } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { InviteUserDialog } from "./invite-user-dialog"
import { toast } from "sonner"

interface DBUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  avatar: string | null
  lastActive: string | null
}

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [usersList, setUsersList] = useState<DBUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { token, isAdmin, isManager, isSuperAdmin, user: currentUser } = useAuth()
  const canSeeTeam = isAdmin || isManager || isSuperAdmin
  const canCreateUsers = isAdmin || isSuperAdmin

  const fetchUsers = () => {
    fetch("/api/users", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.users) setUsersList(data.users)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (!canSeeTeam) {
      setIsLoading(false)
      return
    }
    fetchUsers()
  }, [token, canSeeTeam])

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canSeeTeam) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          You do not have permission to view the team directory. Please contact your administrator.
        </p>
      </div>
    )
  }

  const filteredUsers = usersList.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case "SUPER_ADMIN":
        return "bg-gradient-to-r from-red-600 to-rose-600 text-white border-0"
      case "ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "MANAGER":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "ENGINEER":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "DESIGNER":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
      case "RESEARCHER":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      case "VIEWER":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role?.toUpperCase()) {
      case "SUPER_ADMIN":
        return <ShieldCheck className="h-3 w-3 mr-1" />
      case "ADMIN":
        return <Shield className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    if (!isAdmin && !isSuperAdmin) {
      toast.error("Only Admins can change user status")
      return
    }
    // Prevent self-deactivation
    if (userId === currentUser?.id) {
      toast.error("You cannot deactivate your own account")
      return
    }
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update user")
      }
    } catch {
      toast.error("Failed to update user status")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage your team members and their roles</p>
        </div>
        {canCreateUsers && (
          <Button onClick={() => setIsInviteOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        )}
      </div>

      <div className="flex items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              {canCreateUsers && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canCreateUsers ? 5 : 4} className="text-center py-6 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(user.role)} variant="secondary">
                    {getRoleIcon(user.role)}
                    {user.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${user.status === "ACTIVE" ? "bg-green-500" : user.status === "PENDING" ? "bg-yellow-500" : "bg-gray-300"}`}
                    />
                    <span className="capitalize text-sm font-medium">
                      {(user.status || "active").toLowerCase()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                </TableCell>
                {canCreateUsers && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View profile</DropdownMenuItem>
                        {(isSuperAdmin || (isAdmin && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) && (
                          <>
                            <DropdownMenuItem>Change role</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={user.status === 'ACTIVE' ? "text-destructive focus:text-destructive" : "text-green-600"}
                              onClick={() => handleToggleStatus(user.id, user.status)}
                            >
                              {user.status === 'ACTIVE' ? 'Deactivate user' : 'Activate user'}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {canCreateUsers && (
        <InviteUserDialog
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          onUserCreated={fetchUsers}
        />
      )}
    </div>
  )
}
