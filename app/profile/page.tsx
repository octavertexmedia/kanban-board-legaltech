"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { Loader2, TicketIcon, Clock, ShieldCheck, Shield } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function ProfilePage() {
  const { user: authUser, token, isAuthenticated } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !authUser?.id) return
    fetch(`/api/users/${authUser.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) setProfileData(data.user)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isAuthenticated, authUser?.id, token])

  if (loading || !profileData) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 pt-6">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
      case "SUPER_ADMIN": return "bg-gradient-to-r from-red-600 to-rose-600 text-white border-0"
      case "ADMIN": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "MANAGER": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "ENGINEER": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-6 pt-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profileData.avatar} alt={profileData.name} className="object-cover" />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                {profileData.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{profileData.name}</h1>
              <p className="text-muted-foreground">{profileData.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getRoleBadge(profileData.role)} variant="secondary">
                  {profileData.role === "SUPER_ADMIN" && <ShieldCheck className="h-3 w-3 mr-1" />}
                  {profileData.role === "ADMIN" && <Shield className="h-3 w-3 mr-1" />}
                  {profileData.role.replace('_', ' ')}
                </Badge>
                <Badge variant={profileData.status === "ACTIVE" ? "default" : "destructive"}
                  className={profileData.status === "ACTIVE" ? "bg-green-500 hover:bg-green-600" : ""}>
                  {profileData.status}
                </Badge>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>Joined {new Date(profileData.createdAt).toLocaleDateString()}</span>
                {profileData.lastActive && <span>Last active {formatDistanceToNow(new Date(profileData.lastActive))} ago</span>}
              </div>
            </div>
          </div>

          <Tabs defaultValue="tickets" className="w-full">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="tickets">Assigned Tickets</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="tickets" className="space-y-4">
              {profileData.assignedTickets?.length > 0 ? (
                profileData.assignedTickets.map((t: any) => (
                  <Card key={t.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <TicketIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.column?.title || 'Unknown'} • {t.priority}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{t.type}</Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
                  <TicketIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No assigned tickets</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-0">
              {profileData.activityLogs?.length > 0 ? (
                <div className="relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-border pl-8 space-y-4">
                  {profileData.activityLogs.map((log: any) => (
                    <div key={log.id} className="relative">
                      <div className="absolute left-[-20px] top-[8px] w-2 h-2 rounded-full bg-blue-500 ring-2 ring-background" />
                      <Card className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{log.details}</p>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">{log.action} • {log.entity}</p>
                          </div>
                          <time className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </time>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No recent activity</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
