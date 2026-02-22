"use client"

import { useState, useEffect } from "react"
import { PageShell } from "@/components/layout/page-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { notificationService, Notification } from "@/lib/services/notification-service"
import { users } from "@/lib/initial-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  // For demo purposes, we'll use the first user as the current user
  const currentUserId = users[0].id

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Get notifications for the current user
      const userNotifications = notificationService.getUserNotifications(currentUserId)
      setNotifications(userNotifications)

      // Add some demo notifications if there aren't any
      if (userNotifications.length === 0) {
        addDemoNotifications()
      }

      setLoading(false)
    }, 800)
  }, [currentUserId])

  const addDemoNotifications = async () => {
    // Add demo notifications
    await notificationService.notify(
      users[0],
      "ticket_assigned",
      {
        title: "Implement user authentication",
        ticketId: "ticket-1",
        projectId: "project-1",
        priority: "high",
        dueDate: "2023-12-15",
        user: users[0],
        assignedBy: users[1]
      }
    )

    await notificationService.notify(
      users[0],
      "meeting_scheduled",
      {
        title: "Website Redesign Planning",
        organizer: users[1],
      }
    )

    await notificationService.notify(
      users[0],
      "project_created",
      {
        projectName: "Mobile App Launch",
        projectId: "project-3",
        createdBy: users[2]
      }
    )

    // Update state
    const updatedNotifications = notificationService.getUserNotifications(currentUserId)
    setNotifications(updatedNotifications)
  }

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId)

    // Update state
    const updatedNotifications = notificationService.getUserNotifications(currentUserId)
    setNotifications(updatedNotifications)
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead(currentUserId)

    // Update state
    const updatedNotifications = notificationService.getUserNotifications(currentUserId)
    setNotifications(updatedNotifications)
  }

  const filteredNotifications = filter === "all"
    ? notifications
    : filter === "unread"
      ? notifications.filter(n => !n.readAt)
      : notifications.filter(n => !!n.readAt)

  const unreadCount = notifications.filter(n => !n.readAt).length

  return (
    <PageShell maxWidth="4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-xs mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-4 divide-y">
                {[1, 2, 3].map(i => (
                  <div key={i} className="pt-4 first:pt-0">
                    <div className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 ${!notification.readAt ? 'bg-muted/50' : ''}`}
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <time className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </time>
                      </div>

                      <p className="text-sm text-muted-foreground">{notification.message}</p>

                      <div className="flex justify-between items-center pt-2">
                        {!notification.readAt && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">New</Badge>
                        )}

                        <div className="flex gap-2 ml-auto">
                          {!notification.readAt && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-auto py-1 px-2"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}

                          {notification.linkTo && (
                            <Button
                              variant="default"
                              size="sm"
                              className="text-xs h-auto py-1 px-2"
                              asChild
                            >
                              <Link href={notification.linkTo}>
                                View
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No notifications found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </PageShell>
  )
}
