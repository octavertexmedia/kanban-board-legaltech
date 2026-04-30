"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Plus,
    Video,
    Users,
    Clock,
    ExternalLink,
    Calendar,
    Sparkles
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"

interface DBUser {
    id: string
    name: string
    email: string
    avatar: string | null
    role?: string
}

interface DBMeeting {
    id: string
    title: string
    description: string | null
    startTime: string
    endTime: string
    meetLink: string | null
    organizer: DBUser
    attendees: DBUser[]
}

// Time range: 7 AM to 8 PM (13 hours)
const START_HOUR = 7
const END_HOUR = 20
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOUR_WIDTH = 140 // Slightly wider for better breathing room
const MEMBER_COL_WIDTH = 240 // A bit more room for the member column
const ROW_HEIGHT = 72 // Taller rows

// Modern, glowing color palette for meeting blocks
const MEETING_COLORS = [
    { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-700 dark:text-blue-300", accent: "bg-blue-500", glow: "shadow-blue-500/20" },
    { bg: "bg-violet-500/20", border: "border-violet-500/30", text: "text-violet-700 dark:text-violet-300", accent: "bg-violet-500", glow: "shadow-violet-500/20" },
    { bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-700 dark:text-emerald-300", accent: "bg-emerald-500", glow: "shadow-emerald-500/20" },
    { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-700 dark:text-amber-300", accent: "bg-amber-500", glow: "shadow-amber-500/20" },
    { bg: "bg-rose-500/20", border: "border-rose-500/30", text: "text-rose-700 dark:text-rose-300", accent: "bg-rose-500", glow: "shadow-rose-500/20" },
    { bg: "bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-700 dark:text-cyan-300", accent: "bg-cyan-500", glow: "shadow-cyan-500/20" },
]

function getMeetingColor(index: number) {
    return MEETING_COLORS[index % MEETING_COLORS.length]
}

function getTimePosition(dateStr: string): number {
    const d = new Date(dateStr)
    const hours = d.getHours() + d.getMinutes() / 60
    return Math.max(0, hours - START_HOUR) * HOUR_WIDTH
}

function getTimeWidth(startStr: string, endStr: string): number {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const startHours = start.getHours() + start.getMinutes() / 60
    const endHours = end.getHours() + end.getMinutes() / 60
    const clampedStart = Math.max(startHours, START_HOUR)
    const clampedEnd = Math.min(endHours, END_HOUR)
    return Math.max(0, (clampedEnd - clampedStart) * HOUR_WIDTH)
}

function formatTimeShort(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}

export function TeamTimeline() {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [meetings, setMeetings] = useState<DBMeeting[]>([])
    const [users, setUsers] = useState<DBUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)
    const { isAuthenticated } = useAuth()
    const scrollRef = useRef<HTMLDivElement>(null)

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch("/api/users", { credentials: 'include' })
            const data = await res.json()
            if (res.ok) setUsers(data.users || [])
        } catch { }
    }, [isAuthenticated])

    const fetchMeetings = useCallback(async (date: Date) => {
        setIsLoading(true)
        try {
            const dateStr = date.toISOString().split("T")[0]
            const res = await fetch(`/api/meetings?date=${dateStr}`, { credentials: 'include' })
            const data = await res.json()
            if (res.ok) setMeetings(data.meetings || [])
            else throw new Error(data.error)
        } catch (err: any) {
            toast.error("Failed to load meetings", { description: err?.message })
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated])

    useEffect(() => { fetchUsers() }, [fetchUsers])
    useEffect(() => { fetchMeetings(selectedDate) }, [selectedDate, fetchMeetings])

    useEffect(() => {
        if (scrollRef.current && !isLoading) {
            // Slight delay to allow smooth sliding
            setTimeout(() => {
                const now = new Date()
                const hours = now.getHours() + now.getMinutes() / 60
                const scrollPos = Math.max(0, (hours - START_HOUR - 1.5) * HOUR_WIDTH)
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' })
                }
            }, 300)
        }
    }, [isLoading])

    const userMeetings = useMemo(() => {
        const map = new Map<string, DBMeeting[]>()
        users.forEach((u) => map.set(u.id, []))
        meetings.forEach((meeting) => {
            if (map.has(meeting.organizer.id)) map.get(meeting.organizer.id)!.push(meeting)
            meeting.attendees.forEach((attendee) => {
                if (map.has(attendee.id) && attendee.id !== meeting.organizer.id) {
                    map.get(attendee.id)!.push(meeting)
                }
            })
        })
        return map
    }, [meetings, users])

    const meetingColorMap = useMemo(() => {
        const map = new Map<string, ReturnType<typeof getMeetingColor>>()
        meetings.forEach((m, i) => map.set(m.id, getMeetingColor(i)))
        return map
    }, [meetings])

    const goToday = () => setSelectedDate(new Date())
    const goPrev = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d) }
    const goNext = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d) }
    const isToday = selectedDate.toDateString() === new Date().toDateString()

    const now = new Date()
    const currentTimePos = isToday ? Math.max(0, (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_WIDTH) : -1
    const dateLabel = selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

    const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => {
        const hour = START_HOUR + i
        const ampm = hour >= 12 ? "PM" : "AM"
        const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        return `${h} ${ampm}`
    })

    const handleMeetingScheduled = (newMeeting: DBMeeting) => {
        const meetDate = new Date(newMeeting.startTime)
        const isSameDay = meetDate.toDateString() === selectedDate.toDateString()
        if (isSameDay) {
            setMeetings((prev) => [...prev, newMeeting].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()))
        }
        toast.success("Meeting scheduled!", { description: `"${newMeeting.title}" has been added.` })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 flex flex-col h-full"
        >
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                    <Sparkles className="w-24 h-24 text-primary animate-pulse" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-500">
                        Team Schedule
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Visualize your team's day brilliantly.
                    </p>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <Button variant="outline" size="icon" onClick={() => fetchMeetings(selectedDate)} className="rounded-full shadow-sm hover:shadow-md transition-all">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button onClick={() => setIsScheduleOpen(true)} className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 bg-gradient-to-r from-primary to-indigo-600 text-white transition-all transform hover:scale-105">
                        <Plus className="mr-2 h-4 w-4" /> Schedule New
                    </Button>
                </div>
            </div>

            {/* Navigation Strip */}
            <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-xl backdrop-blur-sm border shadow-inner">
                <div className="flex items-center bg-background rounded-lg p-1 shadow-sm border">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-muted" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant={isToday ? "secondary" : "ghost"} size="sm" className="h-8 px-4 font-medium rounded-md" onClick={goToday}>Today</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-muted" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <h2 className="text-lg font-semibold tracking-tight ml-2">{dateLabel}</h2>
                <div className="ml-auto flex gap-2">
                    <Badge variant="outline" className="bg-background/50 backdrop-blur-md border-primary/20 text-primary px-3 py-1">
                        <Users className="h-3.5 w-3.5 mr-1.5" /> {users.length} members
                    </Badge>
                    <Badge variant="outline" className="bg-background/50 backdrop-blur-md border-violet-500/20 text-violet-500 px-3 py-1">
                        <Video className="h-3.5 w-3.5 mr-1.5" /> {meetings.length} events
                    </Badge>
                </div>
            </div>

            {/* Main Timeline Board */}
            <div className="relative border border-border/60 rounded-2xl overflow-hidden bg-background/50 flex-1 flex flex-col shadow-xl shadow-black/5 ring-1 ring-white/5 backdrop-blur-2xl">
                {isLoading ? (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="font-medium text-muted-foreground animate-pulse">Syncing timestamps...</p>
                        </div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                        <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-bold">No team members yet</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm">Invite people to your workspace to start scheduling.</p>
                    </div>
                ) : null}

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Left Panel: Members */}
                    <div className="shrink-0 border-r border-border/50 bg-card/80 backdrop-blur-xl z-20 flex flex-col shadow-sm" style={{ width: MEMBER_COL_WIDTH }}>
                        <div className="flex items-center justify-between border-b border-border/50 px-5" style={{ height: 60 }}>
                            <span className="font-semibold text-sm flex items-center gap-2 text-foreground/80">
                                <Users className="w-4 h-4 text-primary" /> Members
                            </span>
                        </div>
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {users.map((user, idx) => {
                                const memberMeetings = userMeetings.get(user.id) || []
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                                        key={user.id}
                                        className="group relative flex items-center gap-3 px-4 py-2 border-b border-border/30 last:border-b-0 hover:bg-primary/5 transition-all cursor-pointer"
                                        style={{ height: ROW_HEIGHT }}
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                                        <div className="relative">
                                            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm transition-transform group-hover:scale-105">
                                                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-violet-600 text-white font-medium shadow-inner">
                                                    {user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate opacity-80 mt-0.5">
                                                {memberMeetings.length > 0 ? <span className="text-violet-500 font-medium">{memberMeetings.length} acts today</span> : "Clear schedule"}
                                            </p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Panel: Timeline Canvas */}
                    <div ref={scrollRef} className="flex-1 overflow-auto custom-scrollbar bg-[url('/grid-pattern.svg')] bg-[length:24px_24px] bg-fixed relative">
                        {/* Subtle Background Pattern / Overlay */}
                        <div className="absolute inset-0 bg-background/80 pointer-events-none" />

                        <div className="relative z-10" style={{ width: TOTAL_HOURS * HOUR_WIDTH, minWidth: "100%" }}>
                            {/* Time Headers */}
                            <div className="flex border-b border-border/50 sticky top-0 z-30 bg-card/90 backdrop-blur-xl shadow-sm" style={{ height: 60 }}>
                                {hours.map((label, i) => (
                                    <div key={i} className="shrink-0 flex items-center justify-center border-l border-border/50 first:border-l-0 text-xs font-semibold text-muted-foreground/80 tracking-wider relative" style={{ width: HOUR_WIDTH }}>
                                        {label}
                                        {/* Tick mark */}
                                        <div className="absolute bottom-0 left-1/2 w-px h-2 bg-border/80" />
                                    </div>
                                ))}
                            </div>

                            {/* Canvas Rows */}
                            <div className="relative">
                                {/* Vertical Grid Lines Layer */}
                                <div className="absolute inset-0 flex pointer-events-none z-0 opacity-40">
                                    {hours.map((_, i) => (
                                        <div key={i} className="shrink-0 border-l border-border/50 h-full" style={{ width: HOUR_WIDTH }}>
                                            <div className="h-full border-l border-dashed border-border/50" style={{ marginLeft: HOUR_WIDTH / 2 }} />
                                        </div>
                                    ))}
                                </div>

                                {/* Current Time Indicator */}
                                {currentTimePos >= 0 && currentTimePos <= TOTAL_HOURS * HOUR_WIDTH && (
                                    <div className="absolute z-40 pointer-events-none flex flex-col items-center" style={{ left: currentTimePos, top: 0, bottom: 0 }}>
                                        <div className="relative w-full flex justify-center mt-1">
                                            <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 2, repeat: Infinity }} className="absolute w-5 h-5 bg-red-500/40 rounded-full" />
                                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)] z-10" />
                                            <div className="absolute top-3 w-px bg-gradient-to-b from-red-500 to-transparent" style={{ height: 'calc(100vh)' }} />
                                        </div>
                                    </div>
                                )}

                                {/* User Rows & Meeting Blocks */}
                                {users.map((user) => {
                                    const memberMeetings = userMeetings.get(user.id) || []
                                    return (
                                        <div key={user.id} className="relative border-b border-border/30 last:border-b-0 hover:bg-muted/10 transition-colors" style={{ height: ROW_HEIGHT }}>
                                            <TooltipProvider delayDuration={150}>
                                                <AnimatePresence>
                                                    {memberMeetings.map((meeting) => {
                                                        const left = getTimePosition(meeting.startTime)
                                                        const width = getTimeWidth(meeting.startTime, meeting.endTime)
                                                        const color = meetingColorMap.get(meeting.id) || MEETING_COLORS[0]

                                                        if (width <= 0) return null

                                                        return (
                                                            <Tooltip key={meeting.id}>
                                                                <TooltipTrigger asChild>
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                                        className={`absolute rounded-xl ${color.bg} ${color.border} border shadow-sm backdrop-blur-md cursor-pointer group hover:z-30 overflow-hidden flex items-stretch`}
                                                                        style={{ left, width: Math.max(width, 40), top: 8, height: ROW_HEIGHT - 16 }}
                                                                    >
                                                                        {/* Accent Line */}
                                                                        <div className={`w-1.5 shrink-0 ${color.accent} bg-opacity-80 group-hover:bg-opacity-100 transition-all`} />

                                                                        {/* Content */}
                                                                        <div className="flex flex-col justify-center px-3 py-1 flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Video className={`h-3.5 w-3.5 shrink-0 ${color.text}`} />
                                                                                <span className={`text-xs font-bold truncate ${color.text} drop-shadow-sm`}>
                                                                                    {meeting.title}
                                                                                </span>
                                                                            </div>
                                                                            {width > 120 && (
                                                                                <span className={`text-[10px] mt-0.5 font-medium opacity-80 truncate ${color.text}`}>
                                                                                    {formatTimeShort(meeting.startTime)} - {formatTimeShort(meeting.endTime)}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Hover Glow Effect */}
                                                                        <div className={`absolute inset-0 shadow-inner ${color.glow} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl`} />
                                                                    </motion.div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" align="center" className="w-72 p-0 rounded-xl overflow-hidden shadow-2xl border-border/50 backdrop-blur-3xl bg-card/95">
                                                                    <div className={`h-2 w-full ${color.accent}`} />
                                                                    <div className="p-4 space-y-3">
                                                                        <div>
                                                                            <h4 className="font-bold text-base leading-tight mb-1">{meeting.title}</h4>
                                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted/50 w-fit px-2 py-1 rounded-md">
                                                                                <Clock className="h-3 w-3 text-primary" />
                                                                                {formatTimeShort(meeting.startTime)} – {formatTimeShort(meeting.endTime)}
                                                                            </div>
                                                                        </div>

                                                                        {meeting.description && (
                                                                            <p className="text-sm text-foreground/80 line-clamp-3 bg-muted/30 p-2 rounded-lg border border-border/40">
                                                                                {meeting.description}
                                                                            </p>
                                                                        )}

                                                                        <div className="space-y-2 pt-1">
                                                                            <div className="flex justify-between items-center text-xs">
                                                                                <span className="text-muted-foreground">Organizer</span>
                                                                                <span className="font-semibold flex items-center gap-1.5">
                                                                                    <Avatar className="w-4 h-4"><AvatarImage src={meeting.organizer.avatar || undefined} /><AvatarFallback>{meeting.organizer.name[0]}</AvatarFallback></Avatar>
                                                                                    {meeting.organizer.name}
                                                                                </span>
                                                                            </div>
                                                                            {meeting.attendees.length > 0 && (
                                                                                <div className="flex justify-between items-center text-xs border-t border-border/40 pt-2">
                                                                                    <span className="text-muted-foreground">Attendees</span>
                                                                                    <div className="flex items-center">
                                                                                        <div className="flex -space-x-2 mr-2">
                                                                                            {meeting.attendees.slice(0, 3).map(a => (
                                                                                                <Avatar key={a.id} className="w-5 h-5 border border-background"><AvatarImage src={a.avatar || undefined} /><AvatarFallback className="text-[8px]">{a.name[0]}</AvatarFallback></Avatar>
                                                                                            ))}
                                                                                        </div>
                                                                                        <span className="font-medium text-muted-foreground">+{meeting.attendees.length}</span>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {meeting.meetLink && (
                                                                            <Button asChild size="sm" className="w-full mt-2 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md shadow-blue-500/20">
                                                                                <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer">
                                                                                    <ExternalLink className="h-4 w-4" /> Join Remote Meeting
                                                                                </a>
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )
                                                    })}
                                                </AnimatePresence>
                                            </TooltipProvider>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ScheduleMeetingDialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen} onMeetingSchedule={handleMeetingScheduled} />
        </motion.div>
    )
}
