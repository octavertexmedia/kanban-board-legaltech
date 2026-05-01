"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Activity } from "lucide-react"
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
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.recentActivity) {
          setActivities(data.recentActivity)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  const filteredActivities = filter === "all" ? activities : activities.filter((a) => a.entity === filter)

  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "text-green-600 dark:text-green-400"
      case "moved":
        return "text-blue-600 dark:text-blue-400"
      case "deleted":
        return "text-red-600 dark:text-red-400"
      case "updated":
        return "text-amber-600 dark:text-amber-400"
      case "scheduled":
        return "text-purple-600 dark:text-purple-400"
      case "completed":
        return "text-emerald-600 dark:text-emerald-400"
      default:
        return "text-muted-foreground"
    }
  }

  if (isLoading) {
    return (
      <Card className="border border-border shadow-none">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="py-2 px-3 space-y-2 border-b border-border">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          Recent activity
        </CardTitle>
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="h-7 w-full grid grid-cols-4 bg-muted/50 p-0.5 rounded-md gap-0">
            <TabsTrigger value="all" className="text-[10px] px-1 h-6 rounded-sm">
              All
            </TabsTrigger>
            <TabsTrigger value="ticket" className="text-[10px] px-1 h-6 rounded-sm">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="meeting" className="text-[10px] px-1 h-6 rounded-sm">
              Meet
            </TabsTrigger>
            <TabsTrigger value="user" className="text-[10px] px-1 h-6 rounded-sm">
              Users
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0 max-h-[min(320px,42vh)] overflow-y-auto">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="border-b border-border last:border-b-0 px-3 py-2 hover:bg-muted/30 flex gap-2.5"
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={activity.user?.avatar || undefined} alt={activity.user?.name} />
                <AvatarFallback className="text-[10px]">{activity.user?.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[11px] leading-snug">
                  <span className="font-medium text-foreground">{activity.user?.name}</span>{" "}
                  <span className={`font-medium ${getActionColor(activity.action)}`}>{activity.action}</span>
                  {activity.details ? <span className="text-muted-foreground"> {activity.details}</span> : null}
                </p>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className="text-[9px] text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                  <Badge variant="outline" className="text-[8px] uppercase px-1 py-0 h-4">
                    {activity.entity}
                  </Badge>
                  {activity.project ? (
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 truncate max-w-[120px]">
                      {activity.project.name}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 px-3">
            <p className="text-xs font-medium text-foreground">No recent activity</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Updates will show here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
