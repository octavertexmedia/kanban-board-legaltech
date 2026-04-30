"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

const DEFAULT_EMAIL = {
  ticketAssigned: true,
  ticketMentioned: true,
  ticketStatusChange: false,
  projectUpdates: true,
  meetingReminders: true,
  knowledgeArticles: false,
  weeklyDigest: true
}

const DEFAULT_PUSH = {
  ticketAssigned: true,
  ticketMentioned: true,
  ticketStatusChange: true,
  projectUpdates: false,
  meetingReminders: true,
  knowledgeArticles: false
}

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const { isAuthenticated } = useAuth()

  const [emailPreferences, setEmailPreferences] = useState(DEFAULT_EMAIL)
  const [pushPreferences, setPushPreferences] = useState(DEFAULT_PUSH)

  // Load saved preferences
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch("/api/user/preferences", {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (data.emailPreferences) setEmailPreferences(data.emailPreferences)
          if (data.pushPreferences) setPushPreferences(data.pushPreferences)
        }
      } catch { } finally {
        setIsFetching(false)
      }
    }
    if (isAuthenticated) loadPrefs()
    else setIsFetching(false)
  }, [isAuthenticated])

  const handleEmailChange = (field: string, checked: boolean) => {
    setEmailPreferences(prev => ({ ...prev, [field]: checked }))
  }

  const handlePushChange = (field: string, checked: boolean) => {
    setPushPreferences(prev => ({ ...prev, [field]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ emailPreferences, pushPreferences }),
      })
      if (res.ok) {
        toast.success("Notification preferences saved!")
      } else {
        throw new Error("Save failed")
      }
    } catch {
      toast.error("Failed to save notification settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setEmailPreferences(DEFAULT_EMAIL)
    setPushPreferences(DEFAULT_PUSH)
    toast.info("Preferences reset to defaults")
  }

  const emailItems = [
    { key: "ticketAssigned", label: "Ticket assignments", desc: "Get notified when you are assigned to a ticket" },
    { key: "ticketMentioned", label: "Mentions", desc: "Get notified when you are mentioned in a comment" },
    { key: "ticketStatusChange", label: "Status changes", desc: "Get notified when the status of your ticket changes" },
    { key: "projectUpdates", label: "Project updates", desc: "Get notified about updates to projects you're part of" },
    { key: "meetingReminders", label: "Meeting reminders", desc: "Get reminded about upcoming meetings" },
    { key: "knowledgeArticles", label: "Knowledge base articles", desc: "Get notified about new articles and updates" },
    { key: "weeklyDigest", label: "Weekly digest", desc: "Get a summary of activity once a week" },
  ]

  const pushItems = [
    { key: "ticketAssigned", label: "Ticket assignments", desc: "Get push notifications when you are assigned to a ticket" },
    { key: "ticketMentioned", label: "Mentions", desc: "Get push notifications when you are mentioned in a comment" },
    { key: "ticketStatusChange", label: "Status changes", desc: "Get push notifications when the status of your ticket changes" },
    { key: "projectUpdates", label: "Project updates", desc: "Get push notifications about updates to projects you're part of" },
    { key: "meetingReminders", label: "Meeting reminders", desc: "Get push notifications for upcoming meetings" },
    { key: "knowledgeArticles", label: "Knowledge base articles", desc: "Get push notifications about new articles and updates" },
  ]

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email Notifications</TabsTrigger>
              <TabsTrigger value="push">Dashboard Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 pt-4">
              <div className="space-y-4">
                {emailItems.map(item => (
                  <div key={item.key} className="flex items-center justify-between space-x-2">
                    <Label htmlFor={`email-${item.key}`} className="flex-1">
                      <div>{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </Label>
                    <Switch
                      id={`email-${item.key}`}
                      checked={(emailPreferences as any)[item.key]}
                      onCheckedChange={(checked) => handleEmailChange(item.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="push" className="space-y-4 pt-4">
              <div className="space-y-4">
                {pushItems.map(item => (
                  <div key={item.key} className="flex items-center justify-between space-x-2">
                    <Label htmlFor={`push-${item.key}`} className="flex-1">
                      <div>{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </Label>
                    <Switch
                      id={`push-${item.key}`}
                      checked={(pushPreferences as any)[item.key]}
                      onCheckedChange={(checked) => handlePushChange(item.key, checked)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={handleReset}>Reset</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
