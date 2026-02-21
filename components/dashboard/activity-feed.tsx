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
  const { token } = useAuth()

  useEffect(() => {
    fetch("/api/dashboard/stats", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        if (data.recentActivity) {
          setActivities(data.recentActivity)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [token])

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ticket">Tickets</TabsTrigger>
            <TabsTrigger value="meeting">Meetings</TabsTrigger>
            <TabsTrigger value="user">Users</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user?.avatar || undefined} alt={activity.user?.name} />
                <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  {activity.user?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user?.name}</span>{" "}
                  <span className={`${getActionColor(activity.action)}`}>{activity.action}</span>{" "}
                  {activity.details && (
                    <span className="text-muted-foreground">{activity.details}</span>
                  )}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1 py-0 h-4 capitalize"
                  >
                    {activity.entity}
                  </Badge>
                  {activity.project && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0 h-4"
                    >
                      {activity.project.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  )
}
