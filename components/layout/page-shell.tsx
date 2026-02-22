"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { cn } from "@/lib/utils"
import type React from "react"

interface PageShellProps {
    children: React.ReactNode
    /** Additional class names for the main content area */
    className?: string
    /** Whether to constrain width with max-w container */
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full"
    /** Whether to show the dashboard header */
    showHeader?: boolean
    /** Whether to add default padding */
    noPadding?: boolean
}

const maxWidthMap = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "",
}

export function PageShell({
    children,
    className,
    maxWidth = "full",
    showHeader = true,
    noPadding = false,
}: PageShellProps) {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            {showHeader && <DashboardHeader />}
            <main
                className={cn(
                    "flex-1 overflow-y-auto",
                    !noPadding && "p-4 md:p-6",
                    className
                )}
            >
                {maxWidth !== "full" ? (
                    <div className={cn(maxWidthMap[maxWidth], "mx-auto")}>
                        {children}
                    </div>
                ) : (
                    children
                )}
            </main>
        </div>
    )
}
