"use client"

import Image from "next/image"
import Link from "next/link"
import {
  APP_DISPLAY_NAME,
  OCTAVERTEX_LOGO_URL,
  OCTAVERTEX_MARKETING_URL,
} from "@/lib/brand"

export function OctaVertexNavbarBrand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
      <Image
        src={OCTAVERTEX_LOGO_URL}
        alt={`${APP_DISPLAY_NAME} — OctaVertex Media`}
        width={168}
        height={44}
        className="h-8 md:h-9 w-auto max-w-[140px] md:max-w-[168px] object-contain object-left"
        unoptimized
        priority
      />
      <span className="hidden lg:inline text-xs font-semibold text-muted-foreground tracking-tight border-l border-border pl-2.5 truncate max-w-[10rem] xl:max-w-[14rem]">
        {APP_DISPLAY_NAME}
      </span>
    </Link>
  )
}

export function OctaVertexLoginFooter() {
  return (
    <footer className="w-full shrink-0 border-t border-border/50 bg-background/80 py-4 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <a
          href={OCTAVERTEX_MARKETING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-wrap items-center gap-2 md:gap-3 text-muted-foreground hover:text-foreground transition-colors text-xs md:text-sm"
        >
          <span className="leading-snug">Designed and developed by</span>
          <Image
            src={OCTAVERTEX_LOGO_URL}
            alt="OctaVertex Media"
            width={168}
            height={44}
            className="h-8 md:h-9 w-auto object-contain opacity-95 hover:opacity-100"
            unoptimized
          />
        </a>
        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground md:text-sm"
          aria-label="Policies"
        >
          <Link href="/legal/terms" className="hover:text-foreground underline-offset-4 hover:underline">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  )
}
