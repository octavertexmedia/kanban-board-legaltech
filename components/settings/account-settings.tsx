"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

type ProfilePrefs = { bio?: string; website?: string }

export function AccountSettings() {
  const { user, isAuthenticated, isLoading: authLoading, refreshSession } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    website: "",
    avatar: "",
  })
  const [baseline, setBaseline] = useState(formData)

  const load = useCallback(async () => {
    if (!user?.id) return
    setIsFetching(true)
    try {
      const [userRes, prefRes] = await Promise.all([
        fetch(`/api/users/${user.id}`, { credentials: "include" }),
        fetch("/api/user/preferences", { credentials: "include" }),
      ])
      if (!userRes.ok) throw new Error("Failed to load profile")
      const { user: u } = await userRes.json()
      let profile: ProfilePrefs = {}
      if (prefRes.ok) {
        const prefs = await prefRes.json()
        profile = (prefs.profile ?? {}) as ProfilePrefs
      }
      const next = {
        name: u.name ?? "",
        email: u.email ?? "",
        bio: profile.bio ?? "",
        website: profile.website ?? "",
        avatar: u.avatar ?? "",
      }
      setFormData(next)
      setBaseline(next)
    } catch {
      toast.error("Could not load account settings")
    } finally {
      setIsFetching(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id) void load()
    else if (!authLoading && !isAuthenticated) setIsFetching(false)
  }, [authLoading, isAuthenticated, user?.id, load])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setIsLoading(true)
    try {
      const profileRes = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profile: {
            bio: formData.bio.trim(),
            website: formData.website.trim(),
          },
        }),
      })
      if (!profileRes.ok) throw new Error("Preferences save failed")

      const patchRes = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          avatar: formData.avatar.trim() || null,
        }),
      })
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}))
        throw new Error(err.error || "Profile update failed")
      }

      await refreshSession()
      setBaseline({ ...formData })
      toast.success("Profile saved")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isFetching) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading account…
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        Sign in to manage your account.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your name and optional details are stored in this workspace. Email sign-in is managed by your auth provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="avatar">Profile picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={formData.avatar || "/placeholder.svg"}
                    alt={formData.name}
                  />
                  <AvatarFallback>
                    {(formData.name || user.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Input
                id="avatar"
                type="url"
                placeholder="https://…"
                value={formData.avatar}
                onChange={(e) => handleChange("avatar", e.target.value)}
                className="max-w-xl"
              />
              <p className="text-xs text-muted-foreground">
                Paste an image URL. File upload is not available yet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} disabled />
                <p className="text-xs text-muted-foreground">
                  To change your email, contact an administrator or use your organization&apos;s account recovery flow.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={4}
                placeholder="Short introduction"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end space-x-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setFormData(baseline)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sign-in</CardTitle>
            <CardDescription>
              This app uses email and password via Neon Auth. Social login linking is not enabled for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Password changes are on the Security tab. OAuth provider connect/disconnect is not available.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Account deletion and data export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
              <div>
                <div className="font-medium">Delete account</div>
                <div className="text-sm text-muted-foreground">
                  Self-service deletion is not enabled. Ask a Super Admin to deactivate or remove your user record if required.
                </div>
              </div>
              <Button variant="outline" size="sm" type="button" disabled>
                Not available
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
