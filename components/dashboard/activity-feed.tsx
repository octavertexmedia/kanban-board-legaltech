"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth-context"

interface ActivityItem {
  id: string
  action: string
  entity: string
  entityId: string
  details: string | null
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
  project?: {
    id: string
    name: string
  } | null
}

export function ActivityFeed() {
  const [filter, setFilter] = useState("all")
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetch("/api/dashboard/stats", {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data.recentActivity) {
          setActivities(data.recentActivity)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  const filteredActivities = filter === "all"
    ? activities
    : activities.filter(a => a.entity === filter)

  const getActionColor = (action: string) => {
    switch (action) {
      case "created": return "text-green-600"
      case "moved": return "text-blue-600"
      case "deleted": return "text-red-600"
      case "updated": return "text-amber-600"
      case "scheduled": return "text-purple-600"
      case "completed": return "text-emerald-600"
      default: return "text-muted-foreground"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl shadow-black/5 ring-1 ring-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          </div>
          Recent Activity
        </CardTitle>
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full mt-4">
          <TabsList className="grid grid-cols-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">All</TabsTrigger>
            <TabsTrigger value="ticket" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Tickets</TabsTrigger>
            <TabsTrigger value="meeting" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Meetings</TabsTrigger>
            <TabsTrigger value="user" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Users</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-0 p-0 max-h-[400px] overflow-y-auto custom-scrollbar">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, idx) => (
            <div key={activity.id} className="group relative border-b border-border/50 last:border-b-0 p-4 hover:bg-muted/30 transition-colors flex gap-4">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
              <div className="relative">
                {idx !== filteredActivities.length - 1 && (
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 w-px h-[calc(100%+16px)] bg-border/50" />
                )}
                <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={activity.user?.avatar || undefined} alt={activity.user?.name} />
                  <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    {activity.user?.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-1.5 flex-1 pt-1 min-w-0">
                <p className="text-sm leading-snug">
                  <span className="font-semibold text-foreground">{activity.user?.name}</span>{" "}
                  <span className={`font-medium ${getActionColor(activity.action)}`}>{activity.action}</span>{" "}
                  {activity.details && (
                    <span className="text-muted-foreground">{activity.details}</span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-muted-foreground mt-1">
                  <span className="flex items-center gap-1.5 opacity-80">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                  <Badge variant="outline" className="bg-muted/50 text-[9px] uppercase tracking-wider px-1.5 py-0">
                    {activity.entity}
                  </Badge>
                  {activity.project && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 text-[9px] uppercase tracking-wider px-1.5 py-0 border-blue-500/20">
                      {activity.project.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl opacity-50">⚡</span>
            </div>
            <p className="font-medium text-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for updates</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
