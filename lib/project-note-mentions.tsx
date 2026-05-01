"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"

const EMAIL_MENTION =
    /\B@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,})\b/g

/** Renders plain text with `@email` segments highlighted as mentions. */
export function renderNoteBodyWithMentions(body: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    let last = 0
    let m: RegExpExecArray | null
    const re = new RegExp(EMAIL_MENTION.source, "g")
    let key = 0
    while ((m = re.exec(body)) !== null) {
        if (m.index > last) {
            parts.push(
                <span key={`t-${key++}`}>{body.slice(last, m.index)}</span>,
            )
        }
        parts.push(
            <Badge
                key={`m-${key++}`}
                variant="secondary"
                className="mx-0.5 align-middle font-normal text-xs"
            >
                @{m[1]}
            </Badge>,
        )
        last = m.index + m[0].length
    }
    if (last < body.length) {
        parts.push(<span key={`t-${key++}`}>{body.slice(last)}</span>)
    }
    return parts.length > 0 ? parts : body
}
