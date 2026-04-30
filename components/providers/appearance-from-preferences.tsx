'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth-context'
import {
  applyAppearanceToDocument,
  clearAppearanceFromDocument,
  type AppearancePreferences,
} from '@/lib/user-preferences'

export function AppearanceFromPreferences() {
  const { isAuthenticated, isLoading } = useAuth()
  const { setTheme } = useTheme()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      clearAppearanceFromDocument()
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch('/api/user/preferences', { credentials: 'include' })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { appearance?: AppearancePreferences }
        const appearance = data.appearance
        applyAppearanceToDocument(appearance)
        if (appearance?.theme && ['light', 'dark', 'system'].includes(appearance.theme)) {
          setTheme(appearance.theme)
        }
      } catch {
        if (!cancelled) clearAppearanceFromDocument()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, isLoading, setTheme])

  return null
}
