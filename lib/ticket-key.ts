/** Derive a Jira-style issue key from project name + ticket id (no DB field required). */
export function projectKeyFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "TKT"
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase()
  return words
    .slice(0, 4)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function ticketDisplayKey(projectName: string, ticketId: string): string {
  const prefix = projectKeyFromName(projectName)
  const suffix = ticketId.replace(/[^a-z0-9]/gi, "").slice(-5).toUpperCase()
  return `${prefix}-${suffix}`
}
