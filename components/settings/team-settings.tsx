"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, Plus, MoreHorizontal, Mail, CheckCircle2, AlertCircle, Shield, Crown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { users } from "@/lib/initial-data"
import { User } from "@/lib/types"
import { EmailService } from "@/lib/email/email-service"
import { toast } from "sonner"

type TeamMember = User & { role: string }

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Crown className="h-3 w-3 text-amber-500" />,
  manager: <Shield className="h-3 w-3 text-blue-500" />,
}

const roleBadgeColors: Record<string, string> = {
  admin: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  manager: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  engineer: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  designer: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  researcher: "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  member: "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
}

export function TeamSettings() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    users.map(user => ({
      ...user,
      role: user.role || "Member"
    }))
  )

  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "member",
  })

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formattedRole = inviteForm.role.charAt(0).toUpperCase() + inviteForm.role.slice(1)

    // Send invitation email via AWS SES
    try {
      const result = await EmailService.sendTeamInvite({
        to: inviteForm.email,
        inviteeName: inviteForm.name,
        inviterName: "John Doe",
        teamName: "OctaVertex Media",
        role: formattedRole,
      })

      if (result.success) {
        toast.success("Invitation sent!", {
          description: `Email sent to ${inviteForm.email}`,
          icon: <CheckCircle2 className="h-4 w-4" />,
        })
      } else {
        toast.warning("Member added (email not sent)", {
          description:
            "Check AWS SES (AWS_SES_FROM_EMAIL, AWS_REGION, credentials). For server sends, set INTERNAL_EMAIL_WORKER_SECRET.",
          icon: <AlertCircle className="h-4 w-4" />,
        })
      }
    } catch {
      toast.warning("Member added (email not sent)", {
        description: "Email delivery failed",
        icon: <AlertCircle className="h-4 w-4" />,
      })
    }

    // Add the new member to the list
    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: inviteForm.name,
      email: inviteForm.email,
      role: formattedRole,
      status: "pending",
      lastActive: new Date().toISOString(),
      avatar: "",
    }

    setTeamMembers([...teamMembers, newMember])

    // Reset form and close dialog
    setInviteForm({ email: "", name: "", role: "member" })
    setIsLoading(false)
    setIsInviteDialogOpen(false)
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    setTeamMembers(members =>
      members.map(member =>
        member.id === userId
          ? { ...member, role: newRole }
          : member
      )
    )
    toast.success("Role updated", {
      description: `Role changed to ${newRole}`,
    })
  }

  const handleRemoveMember = (userId: string) => {
    const member = teamMembers.find(m => m.id === userId)
    setTeamMembers(members => members.filter(member => member.id !== userId))
    toast.success("Member removed", {
      description: `${member?.name || 'User'} has been removed from the team`,
    })
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
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage team members and their roles. Invitations are sent via email.
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
                placeholder="Search team members..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setIsInviteDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="col-span-5 md:col-span-4">Member</div>
              <div className="col-span-5 md:col-span-4 hidden md:block">Email</div>
              <div className="col-span-4 md:col-span-2">Role</div>
              <div className="col-span-3 md:col-span-2">Actions</div>
            </div>

            {filteredMembers.length > 0 ? (
              <div className="divide-y">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors"
                  >
                    <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-2 ring-background">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm flex items-center gap-1.5">
                          {member.name}
                          {roleIcons[member.role.toLowerCase()]}
                        </div>
                        <div className="text-xs text-muted-foreground md:hidden">
                          {member.email}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-5 md:col-span-4 hidden md:block text-sm text-muted-foreground">
                      {member.email}
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${roleBadgeColors[member.role.toLowerCase()] || roleBadgeColors.member}`}
                      >
                        {member.role}
                      </Badge>
                    </div>

                    <div className="col-span-3 md:col-span-2 flex items-center gap-2">
                      {member.status === "pending" && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 text-[10px] animate-pulse">
                          Pending
                        </Badge>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, "admin")}>
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, "manager")}>
                            Make Manager
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, "engineer")}>
                            Make Engineer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No team members found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Team Settings</CardTitle>
          <CardDescription>
            Configure team-wide settings and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input id="team-name" defaultValue="Legal Tech Team" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-domain">Team Domain</Label>
              <Input id="team-domain" defaultValue="legaltech.cengineers.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline">Export Team Data</Button>
              <Button variant="destructive">Delete Team</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new member to your team
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-name">Name</Label>
                <Input
                  id="invite-name"
                  placeholder="Jane Smith"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="engineer">Engineer</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="researcher">Researcher</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
