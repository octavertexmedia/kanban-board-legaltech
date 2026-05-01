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

export function DashboardCharts() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [charts, setCharts] = useState<ChartData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard/stats')
            const data = await res.json()
            setStats(data.stats)
            setCharts(data.charts)
        } catch (error) {
            console.error('Failed to load dashboard stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
                        <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
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
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-xl">
                <p className="font-medium text-sm">{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} className="text-sm" style={{ color: p.color }}>
                        {p.name}: <span className="font-semibold">{p.value}</span>
                    </p>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* ─── Stat Summary Cards ─────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Projects</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-3xl font-bold">{stats.activeProjects}</p>
                            <span className="text-xs text-muted-foreground">of {stats.totalProjects}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completion Rate</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-3xl font-bold">{stats.completionRate}%</p>
                            <span className="text-xs text-muted-foreground">{stats.doneTickets}/{stats.totalTickets}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Week</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-3xl font-bold">{stats.thisWeekTickets}</p>
                            <div className="flex items-center gap-1">
                                <TrendIcon value={stats.ticketTrend} />
                                <span className={`text-xs font-medium ${stats.ticketTrend > 0 ? 'text-green-500' : stats.ticketTrend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {stats.ticketTrend > 0 ? '+' : ''}{stats.ticketTrend}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority Items</p>
                        <div className="flex items-end justify-between mt-2">
                            <p className="text-3xl font-bold">{stats.highPriorityTickets + stats.urgentTickets}</p>
                            <span className="text-xs text-muted-foreground">{stats.urgentTickets} urgent</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Charts Row ─────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Activity Trend (Area Chart) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Activity Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
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
                                <XAxis dataKey="name" fontSize={12} className="fill-muted-foreground" />
                                <YAxis fontSize={12} className="fill-muted-foreground" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
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
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Tickets by Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={charts.ticketsByStatus}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={100}
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
                                        <span className="text-sm text-foreground">{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Tickets by Priority (Bar Chart) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Tickets by Priority</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={charts.ticketsByPriority} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" fontSize={12} className="fill-muted-foreground" />
                                <YAxis fontSize={12} className="fill-muted-foreground" />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Tickets" radius={[6, 6, 0, 0]}>
                                    {charts.ticketsByPriority.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Team Workload (Horizontal Bar) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Team Workload</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={charts.teamWorkload} layout="vertical" barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis type="number" fontSize={12} className="fill-muted-foreground" />
                                <YAxis
                                    dataKey="name" type="category" fontSize={12}
                                    className="fill-muted-foreground" width={100}
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
