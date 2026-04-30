"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export function ClientPortalHeaderActions() {
  const { logout, user } = useAuth()

  return (
    <>
      <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
        Profile
      </Link>
      <Button variant="outline" size="sm" onClick={() => void logout()}>
        Sign out
      </Button>
      {user?.name && (
        <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[8rem]">
          {user.name}
        </span>
      )}
    </>
  )
}
