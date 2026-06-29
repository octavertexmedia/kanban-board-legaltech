import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { OctaVertexNavbarBrand } from '@/components/brand/octavertex-brand'
import { ClientPortalHeaderActions } from '@/components/client/client-portal-header-actions'
import { neonAuth } from '@/lib/neon/server'
import prisma from '@/lib/db'

export default async function ClientLayout({ children }: { children: ReactNode }) {
    const { data: session } = await neonAuth.getSession()
    const email = session?.user?.email?.toLowerCase()?.trim()
    if (!email) {
        redirect('/auth/sign-in')
    }
    const user = await prisma.user.findUnique({
        where: { email },
        select: { userKind: true },
    })
    if (!user || user.userKind !== 'CLIENT') {
        redirect('/')
    }

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-background">
            <header className="sticky top-0 z-40 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
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
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
    )
}
