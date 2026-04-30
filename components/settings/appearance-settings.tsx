"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  applyAppearanceToDocument,
  type AppearancePreferences,
} from "@/lib/user-preferences"

export function AppearanceSettings() {
  const { setTheme } = useTheme()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [colorScheme, setColorScheme] = useState<"light" | "dark" | "system">("system")
  const [fontSize, setFontSize] = useState<"small" | "default" | "large">("default")
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [denseMode, setDenseMode] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  const load = useCallback(async () => {
    setIsFetching(true)
    try {
      const res = await fetch("/api/user/preferences", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      const a = (data.appearance ?? {}) as AppearancePreferences
      if (a.theme && ["light", "dark", "system"].includes(a.theme)) {
        setColorScheme(a.theme)
      }
      if (a.fontSize) setFontSize(a.fontSize)
      if (typeof a.animationsEnabled === "boolean") setAnimationsEnabled(a.animationsEnabled)
      if (typeof a.denseMode === "boolean") setDenseMode(a.denseMode)
      if (typeof a.reducedMotion === "boolean") setReducedMotion(a.reducedMotion)
      if (typeof a.highContrast === "boolean") setHighContrast(a.highContrast)

      applyAppearanceToDocument(a)
    } catch {
      toast.error("Could not load appearance preferences")
    } finally {
      setIsFetching(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && isAuthenticated) void load()
    else if (!authLoading && !isAuthenticated) setIsFetching(false)
  }, [authLoading, isAuthenticated, load])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const appearance: AppearancePreferences = {
        theme: colorScheme,
        fontSize,
        animationsEnabled,
        denseMode,
        reducedMotion,
        highContrast,
      }
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appearance }),
      })
      if (!res.ok) throw new Error("Save failed")

      setTheme(colorScheme)
      applyAppearanceToDocument(appearance)
      toast.success("Appearance saved")
    } catch {
      toast.error("Failed to save appearance")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    setColorScheme("system")
    setFontSize("default")
    setAnimationsEnabled(true)
    setDenseMode(false)
    setReducedMotion(false)
    setHighContrast(false)
    setTheme("system")
    applyAppearanceToDocument({
      theme: "system",
      fontSize: "default",
      animationsEnabled: true,
      denseMode: false,
      reducedMotion: false,
      highContrast: false,
    })
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          appearance: {
            theme: "system",
            fontSize: "default",
            animationsEnabled: true,
            denseMode: false,
            reducedMotion: false,
            highContrast: false,
          },
        }),
      })
      toast.info("Appearance reset to defaults")
    } catch {
      toast.error("Reset failed to sync to server")
    }
  }

  if (authLoading || isFetching) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading appearance…
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        Sign in to customize appearance.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Theme and layout preferences are saved to your account and applied when you sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Choose light, dark, or match the system.
              </p>
              <RadioGroup
                value={colorScheme}
                onValueChange={(v) =>
                  setColorScheme(v as "light" | "dark" | "system")
                }
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="light" id="light" className="sr-only" />
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="mb-3 h-5 w-5 rounded-full bg-primary" />
                    <span>Light</span>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="dark" id="dark" className="sr-only" />
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="mb-3 h-5 w-5 rounded-full bg-black" />
                    <span>Dark</span>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="system" id="system" className="sr-only" />
                  <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="mb-3 h-5 w-5 rounded-full bg-gradient-to-r from-primary to-black" />
                    <span>System</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Font size</Label>
              <Select
                value={fontSize}
                onValueChange={(v) =>
                  setFontSize(v as "small" | "default" | "large")
                }
              >
                <SelectTrigger id="font-size">
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Motion and animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn off to minimize movement across the UI (stored as a preference).
                  </p>
                </div>
                <Switch
                  checked={animationsEnabled}
                  onCheckedChange={setAnimationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dense layout</Label>
                  <p className="text-sm text-muted-foreground">
                    Tighter spacing and slightly smaller radii where supported.
                  </p>
                </div>
                <Switch checked={denseMode} onCheckedChange={setDenseMode} />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
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
          <CardTitle>Accessibility</CardTitle>
          <CardDescription>
            These options are saved with your account and applied on every visit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Reduced motion</Label>
              <p className="text-sm text-muted-foreground">
                Stronger minimization of transitions (in addition to turning off animations above).
              </p>
            </div>
            <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">High contrast borders</Label>
              <p className="text-sm text-muted-foreground">
                Slightly stronger borders and inputs for clarity.
              </p>
            </div>
            <Switch checked={highContrast} onCheckedChange={setHighContrast} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="button" variant="secondary" onClick={handleSave} disabled={isLoading}>
            Save accessibility options
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
