"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
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

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<DBNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { token, isAuthenticated } = useAuth()

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch { }
  }, [token])

  // Initial fetch + polling every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ read: true }),
      })
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() })))
      setUnreadCount(0)
    } catch { }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ticket_assigned": return "🎫"
      case "ticket_status_changed": return "📋"
      case "meeting_scheduled": return "📅"
      case "mention": return "💬"
      case "project_created": return "📁"
      default: return "🔔"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background animate-in fade-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-auto py-1 px-2"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 ${!notification.readAt ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''} cursor-default`}
              >
                <div className="flex w-full justify-between items-start gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-base mt-0.5">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium leading-tight">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                    </div>
                  </div>
                  <time className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </time>
                </div>

                <div className="flex justify-between items-center w-full mt-1.5">
                  {!notification.readAt && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] h-5 border-blue-200">New</Badge>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {!notification.readAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 py-0 px-2"
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id) }}
                      >
                        Mark read
                      </Button>
                    )}
                    {notification.linkTo && (
                      <Button variant="default" size="sm" className="text-xs h-6 py-0 px-2" asChild>
                        <Link href={notification.linkTo}>View</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center text-blue-600 font-medium cursor-pointer">
          <Link href="/notifications">View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
