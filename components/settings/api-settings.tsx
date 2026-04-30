"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function APISettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API access</CardTitle>
          <CardDescription>How automation integrates with this app today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This product does not issue personal API keys or webhook secrets. All JSON routes under{" "}
            <code className="text-xs rounded bg-muted px-1 py-0.5">/api</code> expect a normal
            browser session (HTTP-only cookies after you sign in).
          </p>
          <p>
            If you need server-to-server access, use a dedicated integration account and the same
            cookie-based session model, or extend the backend with a proper API key model in your
            fork—there is no key management UI here yet.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
