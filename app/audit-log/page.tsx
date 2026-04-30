"use client"

import { useState, useEffect, useCallback } from "react"
import { PageShell } from "@/components/layout/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, ShieldAlert, ChevronLeft, ChevronRight, Activity } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"

interface AuditLog {
    id: string
    action: string
    entity: string
    entityId: string
    details: string
    createdAt: string
    user: {
        id: string
        name: string
        email: string
        avatar: string | null
        role: string
    }
}

export default function AuditLogPage() {
    const { isAuthenticated, isAdmin, isSuperAdmin } = useAuth()
    const canAccess = isAdmin || isSuperAdmin

    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    // Filters
    const [search, setSearch] = useState("")
    const [actionFilter, setActionFilter] = useState("all")
    const [entityFilter, setEntityFilter] = useState("all")

    const fetchLogs = useCallback(async () => {
        if (!isAuthenticated || !canAccess) return
        setIsLoading(true)
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: "30" })
            if (actionFilter !== "all") params.append("action", actionFilter)
            if (entityFilter !== "all") params.append("entity", entityFilter)
            if (search.trim()) params.append("search", search.trim())

            const res = await fetch(`/api/audit-logs?${params}`, {
                credentials: "include",
            })
            const data = await res.json()
            if (res.ok) {
                setLogs(data.logs || [])
                setTotalPages(data.totalPages || 1)
                setTotal(data.total || 0)
            }
        } catch { }
        finally { setIsLoading(false) }
    }, [isAuthenticated, canAccess, page, actionFilter, entityFilter, search])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const getActionColor = (action: string) => {
        switch (action) {
            case "created": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            case "updated": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            case "deleted": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            case "moved": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            case "assigned": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
            case "scheduled": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
            case "completed": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
            case "reassigned": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
            default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
        }
    }

    if (!canAccess) {
        return (
            <PageShell>
                <div className="flex h-[400px] flex-col items-center justify-center text-center">
                    <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground mt-2 max-w-sm">Only administrators can view the audit log.</p>
                </div>
            </PageShell>
        )
    }

    return (
        <PageShell maxWidth="6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        Audit Log
                    </h1>
                    <p className="text-muted-foreground">
                        {total} total events • Global activity log for the workspace
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search activity details..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="created">Created</SelectItem>
                                <SelectItem value="updated">Updated</SelectItem>
                                <SelectItem value="deleted">Deleted</SelectItem>
                                <SelectItem value="moved">Moved</SelectItem>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="reassigned">Reassigned</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1) }}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Entity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Entities</SelectItem>
                                <SelectItem value="ticket">Tickets</SelectItem>
                                <SelectItem value="tickets">Tickets (bulk)</SelectItem>
                                <SelectItem value="user">Users</SelectItem>
                                <SelectItem value="meeting">Meetings</SelectItem>
                                <SelectItem value="project">Projects</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Log Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground font-medium">No activity logs found</p>
                            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                                    <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                                        <AvatarImage src={log.user?.avatar || undefined} />
                                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                                            {log.user?.name?.charAt(0) || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{log.user?.name || 'System'}</span>
                                            <Badge className={`${getActionColor(log.action)} text-[10px] h-5`} variant="secondary">
                                                {log.action}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px] h-5">{log.entity}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{log.details}</p>
                                    </div>
                                    <time className="text-xs text-muted-foreground whitespace-nowrap mt-1 shrink-0">
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                    </time>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages} ({total} total)
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </PageShell>
    )
}
