"use client"

import { useEffect, useId, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

type MermaidState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; svg: string }
  | { status: "error"; message: string }

function MermaidBlock({ code }: { code: string }) {
  const reactId = useId()
  const id = useMemo(() => `mermaid-${reactId.replace(/:/g, "")}`, [reactId])
  const [state, setState] = useState<MermaidState>({ status: "idle" })

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        setState({ status: "loading" })
        const mermaid = (await import("mermaid")).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "default",
        })
        const { svg } = await mermaid.render(id, code)
        if (cancelled) return
        setState({ status: "ready", svg })
      } catch (e) {
        if (cancelled) return
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Failed to render Mermaid diagram",
        })
      }
    }
    void render()
    return () => {
      cancelled = true
    }
  }, [code, id])

  if (state.status === "error") {
    return (
      <pre className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs overflow-auto">
        Mermaid render error: {state.message}
      </pre>
    )
  }

  if (state.status !== "ready") {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Rendering diagram…
      </div>
    )
  }

  return (
    <div
      className="rounded-md border border-border bg-background p-2 overflow-auto"
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  )
}

export function MarkdownRenderer({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            const lang = match?.[1]?.toLowerCase()
            const code = String(children ?? "")
            if (lang === "mermaid") {
              return <MermaidBlock code={code} />
            }

            // inline code
            if (!className) {
              return (
                <code className="rounded bg-muted px-1 py-0.5 text-[0.85em]" {...props}>
                  {children}
                </code>
              )
            }

            return (
              <pre className="rounded-md border border-border bg-muted/30 p-3 overflow-auto">
                <code className={cn("text-xs", className)} {...props}>
                  {children}
                </code>
              </pre>
            )
          },
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
                {...props}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

