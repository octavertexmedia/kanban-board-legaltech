import type { ReactNode } from "react"
import Link from "next/link"
import { OctaVertexNavbarBrand } from "@/components/brand/octavertex-brand"
import { ClientPortalHeaderActions } from "@/components/client/client-portal-header-actions"

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
          <OctaVertexNavbarBrand />
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/client" className="text-muted-foreground hover:text-foreground transition-colors">
              My projects
            </Link>
            <ClientPortalHeaderActions />
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
