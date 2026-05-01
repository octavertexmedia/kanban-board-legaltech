'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ChartData {
    ticketsByStatus: { name: string; value: number; color: string }[]
    ticketsByPriority: { name: string; value: number; color: string }[]
    ticketsByType: { name: string; value: number }[]
    activityByDay: { name: string; tickets: number; comments: number }[]
    teamWorkload: { name: string; tickets: number; avatar: string; role: string }[]
}

interface Stats {
    totalProjects: number
    activeProjects: number
    totalTickets: number
    doneTickets: number
    completionRate: number
    highPriorityTickets: number
    urgentTickets: number
    totalUsers: number
    activeUsers: number
    upcomingMeetings: number
    totalArticles: number
    thisWeekTickets: number
    ticketTrend: number
    thisWeekActivities: number
}

const TYPE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

interface DashboardChartsProps {
    /** Tighter layout for tabbed dashboard (Jira-style density). */
    dense?: boolean
}

export function DashboardCharts({ dense = false }: DashboardChartsProps) {
    const [stats, setStats] = useState<Stats | null>(null)
    const [charts, setCharts] = useState<ChartData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard/stats', { credentials: 'include' })
            const data = await res.json()
            setStats(data.stats)
            setCharts(data.charts)
        } catch (error) {
            console.error('Failed to load dashboard stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const chartH = dense ? 200 : 260
    const gap = dense ? 'gap-3' : 'gap-6'
    const statNum = dense ? 'text-xl font-semibold tabular-nums' : 'text-3xl font-bold'

    if (loading) {
        return (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${gap}`}>
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="border border-border shadow-none">
                        <CardHeader className="py-2 pb-0"><Skeleton className="h-4 w-32" /></CardHeader>
                        <CardContent className="pt-2"><Skeleton className={`w-full ${dense ? 'h-[200px]' : 'h-[250px]'}`} /></CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!charts || !stats) return null

    const TrendIcon = ({ value }: { value: number }) => {
        if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
        if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
        return <Minus className="h-4 w-4 text-gray-400" />
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload) return null
        return (
            <div className="bg-popover border border-border rounded-md p-2 shadow-md text-xs">
                <p className="font-medium">{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color }}>
                        {p.name}: <span className="font-semibold">{p.value}</span>
                    </p>
                ))}
            </div>
        )
    }

    const statPad = dense ? 'p-3' : 'p-4'
    const statLabel = dense
        ? 'text-[10px] font-semibold text-muted-foreground uppercase tracking-wide'
        : 'text-xs font-medium text-muted-foreground uppercase tracking-wide'

    return (
        <div className={dense ? 'space-y-3' : 'space-y-6'}>
            <div className={`grid grid-cols-2 md:grid-cols-4 ${dense ? 'gap-2' : 'gap-4'}`}>
                <Card className="border border-border shadow-none bg-card">
                    <CardContent className={statPad}>
                        <p className={statLabel}>Active projects</p>
                        <div className="flex items-end justify-between mt-1.5">
                            <p className={statNum}>{stats.activeProjects}</p>
                            <span className="text-[10px] text-muted-foreground tabular-nums">of {stats.totalProjects}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-none bg-card">
                    <CardContent className={statPad}>
                        <p className={statLabel}>Completion</p>
                        <div className="flex items-end justify-between mt-1.5">
                            <p className={statNum}>{stats.completionRate}%</p>
                            <span className="text-[10px] text-muted-foreground tabular-nums">{stats.doneTickets}/{stats.totalTickets}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-none bg-card">
                    <CardContent className={statPad}>
                        <p className={statLabel}>This week</p>
                        <div className="flex items-end justify-between mt-1.5">
                            <p className={statNum}>{stats.thisWeekTickets}</p>
                            <div className="flex items-center gap-0.5">
                                <TrendIcon value={stats.ticketTrend} />
                                <span className={`text-[10px] font-medium ${stats.ticketTrend > 0 ? 'text-green-600' : stats.ticketTrend < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                    {stats.ticketTrend > 0 ? '+' : ''}{stats.ticketTrend}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-none bg-card">
                    <CardContent className={statPad}>
                        <p className={statLabel}>Priority</p>
                        <div className="flex items-end justify-between mt-1.5">
                            <p className={statNum}>{stats.highPriorityTickets + stats.urgentTickets}</p>
                            <span className="text-[10px] text-muted-foreground">{stats.urgentTickets} urgent</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${gap}`}>
                {/* Activity Trend (Area Chart) */}
                <Card className="border border-border shadow-none">
                    <CardHeader className={dense ? 'py-2 pb-0' : 'pb-2'}>
                        <CardTitle className={dense ? 'text-xs font-semibold' : 'text-base font-semibold'}>Activity trend</CardTitle>
                    </CardHeader>
                    <CardContent className={dense ? 'pt-2' : undefined}>
                        <ResponsiveContainer width="100%" height={chartH}>
                            <AreaChart data={charts.activityByDay}>
                                <defs>
                                    <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="commentGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" fontSize={dense ? 10 : 12} className="fill-muted-foreground" />
                                <YAxis fontSize={dense ? 10 : 12} className="fill-muted-foreground" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: dense ? 11 : 12 }} />
                                <Area
                                    type="monotone" dataKey="tickets" name="Tickets"
                                    stroke="#6366f1" fillOpacity={1} fill="url(#ticketGradient)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone" dataKey="comments" name="Comments"
                                    stroke="#10b981" fillOpacity={1} fill="url(#commentGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Tickets by Status (Donut Chart) */}
                <Card className="border border-border shadow-none">
                    <CardHeader className={dense ? 'py-2 pb-0' : 'pb-2'}>
                        <CardTitle className={dense ? 'text-xs font-semibold' : 'text-base font-semibold'}>Tickets by status</CardTitle>
                    </CardHeader>
                    <CardContent className={dense ? 'pt-2' : undefined}>
                        <ResponsiveContainer width="100%" height={chartH}>
                            <PieChart>
                                <Pie
                                    data={charts.ticketsByStatus}
                                    cx="50%" cy="50%"
                                    innerRadius={dense ? 48 : 60} outerRadius={dense ? 78 : 100}
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {charts.ticketsByStatus.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    formatter={(value: string) => (
                                        <span className={dense ? 'text-xs text-foreground' : 'text-sm text-foreground'}>{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Tickets by Priority (Bar Chart) */}
                <Card className="border border-border shadow-none">
                    <CardHeader className={dense ? 'py-2 pb-0' : 'pb-2'}>
                        <CardTitle className={dense ? 'text-xs font-semibold' : 'text-base font-semibold'}>Tickets by priority</CardTitle>
                    </CardHeader>
                    <CardContent className={dense ? 'pt-2' : undefined}>
                        <ResponsiveContainer width="100%" height={chartH}>
                            <BarChart data={charts.ticketsByPriority} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" fontSize={dense ? 10 : 12} className="fill-muted-foreground" />
                                <YAxis fontSize={dense ? 10 : 12} className="fill-muted-foreground" />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
                                    {charts.ticketsByPriority.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Team Workload (Horizontal Bar) */}
                <Card className="border border-border shadow-none">
                    <CardHeader className={dense ? 'py-2 pb-0' : 'pb-2'}>
                        <CardTitle className={dense ? 'text-xs font-semibold' : 'text-base font-semibold'}>Team workload</CardTitle>
                    </CardHeader>
                    <CardContent className={dense ? 'pt-2' : undefined}>
                        <ResponsiveContainer width="100%" height={chartH}>
                            <BarChart data={charts.teamWorkload} layout="vertical" barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis type="number" fontSize={dense ? 10 : 12} className="fill-muted-foreground" />
                                <YAxis
                                    dataKey="name" type="category" fontSize={dense ? 10 : 12}
                                    className="fill-muted-foreground" width={dense ? 72 : 100}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="tickets" name="Assigned Tickets" fill="#6366f1" radius={[0, 6, 6, 0]}>
                                    {charts.teamWorkload.map((entry, index) => (
                                        <Cell key={index} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
