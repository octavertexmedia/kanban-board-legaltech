"use client"

import { useState, useEffect, useCallback } from "react"
import { PageShell } from "@/components/layout/page-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface DBNotification {
  id: string
  type: string
  title: string
  message: string
  linkTo: string | null
  readAt: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<DBNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const { isAuthenticated } = useAuth()

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const res = await fetch("/api/notifications", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ read: true }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n)),
      )
    } catch {
      /* ignore */
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      })
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      )
    } catch {
      /* ignore */
    }
  }

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.readAt)
      : filter === "read"
        ? notifications.filter((n) => !!n.readAt)
        : notifications

  const unreadCount = notifications.filter((n) => !n.readAt).length

  return (
    <PageShell maxWidth="4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button variant="outline" size="sm" onClick={() => void handleMarkAllAsRead()}>
            Mark all as read
          </Button>
        ) : null}
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-xs mb-4 h-8">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs">
            Unread
          </TabsTrigger>
          <TabsTrigger value="read" className="text-xs">
            Read
          </TabsTrigger>
        </TabsList>

        <Card className="border shadow-none">
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${!notification.readAt ? "bg-muted/40" : ""}`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <time className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <div className="flex justify-between items-center pt-2">
                        {!notification.readAt ? (
                          <Badge variant="outline" className="text-[10px] h-5">
                            New
                          </Badge>
                        ) : (
                          <span />
                        )}
                        <div className="flex gap-2 ml-auto">
                          {!notification.readAt ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => void handleMarkAsRead(notification.id)}
                            >
                              Mark read
                            </Button>
                          ) : null}
                          {notification.linkTo ? (
                            <Button variant="default" size="sm" className="text-xs h-7" asChild>
                              <Link href={notification.linkTo}>View</Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </PageShell>
  )
}
