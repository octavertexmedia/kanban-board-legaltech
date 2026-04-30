export type AppearancePreferences = {
  theme?: 'light' | 'dark' | 'system'
  fontSize?: 'small' | 'default' | 'large'
  animationsEnabled?: boolean
  denseMode?: boolean
  reducedMotion?: boolean
  highContrast?: boolean
}

const DEEP_KEYS = new Set(['emailPreferences', 'pushPreferences', 'appearance', 'profile'])

/**
 * Merge a partial preferences payload into existing JSON (from User.preferences).
 * Top-level keys in patch replace shallowly except known objects, which are shallow-merged.
 */
export function mergeUserPreferences(
  existingRaw: string | null | undefined,
  patch: Record<string, unknown>
): Record<string, unknown> {
  let base: Record<string, unknown> = {}
  try {
    if (existingRaw) base = JSON.parse(existingRaw) as Record<string, unknown>
  } catch {
    base = {}
  }

  const out: Record<string, unknown> = { ...base }

  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue
    if (DEEP_KEYS.has(k) && typeof v === 'object' && v !== null && !Array.isArray(v)) {
      const prev =
        out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])
          ? (out[k] as Record<string, unknown>)
          : {}
      out[k] = { ...prev, ...(v as Record<string, unknown>) }
    } else {
      out[k] = v
    }
  }

  return out
}

export function applyAppearanceToDocument(appearance: AppearancePreferences | null | undefined) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const a = appearance ?? {}

  const fontSize = a.fontSize ?? 'default'
  if (fontSize === 'default') delete root.dataset.fontSize
  else root.dataset.fontSize = fontSize

  const dense = !!a.denseMode
  if (dense) root.dataset.density = 'compact'
  else delete root.dataset.density

  const reduceMotion =
    a.reducedMotion === true || a.animationsEnabled === false
  root.classList.toggle('app-reduce-motion', reduceMotion)

  root.classList.toggle('app-high-contrast', a.highContrast === true)
}

export function clearAppearanceFromDocument() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  delete root.dataset.fontSize
  delete root.dataset.density
  root.classList.remove('app-reduce-motion', 'app-high-contrast')
}
