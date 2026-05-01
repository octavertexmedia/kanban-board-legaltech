"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ProjectMembersPanel } from "@/components/projects/project-members-panel"
import { ProjectStatusUpdatesPanel } from "@/components/projects/project-status-updates-panel"
import { ProjectNotesPanel } from "@/components/projects/project-notes-panel"
import { Megaphone, StickyNote, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type MemberRow = {
    id: string
    role: string
    user: {
        id: string
        name: string
        email: string
        role: string
        avatar: string | null
        userKind?: string
    }
}

export function ProjectWorkspaceSheets({
    projectId,
    members,
    onTeamChange,
}: {
    projectId: string
    members: MemberRow[]
    onTeamChange: () => void
}) {
    const { isClientUser } = useAuth()
    const [teamOpen, setTeamOpen] = useState(false)
    const [updatesOpen, setUpdatesOpen] = useState(false)
    const [notesOpen, setNotesOpen] = useState(false)

    return (
        <div className="mb-5 flex flex-wrap items-center gap-2">
            <Sheet open={teamOpen} onOpenChange={setTeamOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                        <Users className="h-4 w-4 shrink-0" />
                        Team
                        <span className="text-muted-foreground tabular-nums">
                            ({members.length})
                        </span>
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-md overflow-y-auto"
                >
                    <SheetHeader>
                        <SheetTitle>Project team</SheetTitle>
                        <SheetDescription>
                            People on this project. Managers and admins can add
                            or remove members (owners cannot be removed if they
                            are the only owner).
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <ProjectMembersPanel
                            surface="plain"
                            projectId={projectId}
                            members={members}
                            onMembersChange={() => {
                                onTeamChange()
                            }}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={updatesOpen} onOpenChange={setUpdatesOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                        <Megaphone className="h-4 w-4 shrink-0" />
                        Status updates
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-lg overflow-y-auto"
                >
                    <SheetHeader>
                        <SheetTitle>Project status updates</SheetTitle>
                        <SheetDescription>
                            Share progress with your team or publish to the client
                            portal.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                        <ProjectStatusUpdatesPanel
                            projectId={projectId}
                            readOnly={isClientUser}
                            surface="plain"
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {!isClientUser && (
                <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <StickyNote className="h-4 w-4 shrink-0" />
                            Field notes
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="right"
                        className="w-full sm:max-w-lg overflow-y-auto"
                    >
                        <SheetHeader>
                            <SheetTitle>Field notes</SheetTitle>
                            <SheetDescription>
                                Ongoing discussion for this project. Mention
                                teammates with{" "}
                                <code className="text-xs bg-muted px-1 rounded">
                                    @email
                                </code>{" "}
                                or the quick chips.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                            <ProjectNotesPanel
                                projectId={projectId}
                                members={members}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            )}
        </div>
    )
}
