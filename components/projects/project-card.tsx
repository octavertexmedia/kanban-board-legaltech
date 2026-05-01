"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Ticket, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { DBProject } from "./projects-list"
import { useAuth } from "@/lib/auth-context"
import { ProjectAdminActions } from "./project-admin-actions"

interface ProjectCardProps {
    project: DBProject
    onAdminAction?: () => void
}

export function ProjectCard({ project, onAdminAction }: ProjectCardProps) {
    const { isAdmin } = useAuth()
    const members = project.members?.map((m) => m.user) || []
    const stats = project.stats || {
        totalTickets: 0,
        doneTickets: 0,
        progress: 0,
        memberCount: 0,
    }

    const statusColor =
        project.status === "ACTIVE"
            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : project.status === "COMPLETED"
              ? "bg-blue-100 text-blue-800 border-blue-200"
              : project.status === "ARCHIVED"
                ? "bg-muted text-muted-foreground border-border"
                : "bg-gray-100 text-gray-800 border-gray-200"

    const statusLabel =
        project.status.charAt(0) + project.status.slice(1).toLowerCase()

    return (
        <div className="relative h-full group/card">
            {isAdmin && (
                <div
                    className="absolute right-2 top-2 z-20"
                    onClick={(e) => e.preventDefault()}
                >
                    <ProjectAdminActions
                        projectId={project.id}
                        name={project.name}
                        status={project.status}
                        onChanged={onAdminAction}
                    />
                </div>
            )}
            <Link href={`/projects/${project.id}`} className="block h-full">
                <Card className="h-full overflow-hidden transition-all hover:shadow-lg cursor-pointer border hover:border-primary/30 pt-2">
                    <CardHeader className="p-4 pb-2 pr-12">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-base group-hover/card:text-primary transition-colors line-clamp-1">
                                {project.name}
                            </h3>
                            <Badge
                                variant="outline"
                                className={`text-xs shrink-0 ${statusColor}`}
                            >
                                {statusLabel}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3">
                        <p className="text-muted-foreground text-sm line-clamp-2">
                            {project.description || "No description provided."}
                        </p>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    {stats.doneTickets} / {stats.totalTickets}{" "}
                                    tickets done
                                </span>
                                <span className="font-semibold text-foreground">
                                    {stats.progress}%
                                </span>
                            </div>
                            <Progress value={stats.progress} className="h-1.5" />
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex items-center justify-between gap-3 border-t">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {members.slice(0, 3).map((member) => (
                                    <Avatar
                                        key={member.id}
                                        className="h-6 w-6 border-2 border-background"
                                    >
                                        <AvatarImage
                                            src={member.avatar || undefined}
                                            alt={member.name}
                                        />
                                        <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                            {member.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                                {members.length > 3 && (
                                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                        +{members.length - 3}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {stats.memberCount}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Ticket className="h-3 w-3" />
                                {stats.totalTickets}
                            </span>
                            <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </CardFooter>
                </Card>
            </Link>
        </div>
    )
}
