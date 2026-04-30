'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Filter, Search, X, SlidersHorizontal, LayoutGrid, LayoutList, Table2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BoardFilters {
    search: string
    priority: string
    type: string
    assigneeId: string
    view: 'kanban' | 'list' | 'table'
}

interface BoardFiltersProps {
    filters: BoardFilters
    onFiltersChange: (filters: BoardFilters) => void
    assignees: { id: string; name: string; avatar: string | null }[]
}

export function BoardFiltersBar({ filters, onFiltersChange, assignees }: BoardFiltersProps) {
    const [isOpen, setIsOpen] = useState(false)

    const activeFilterCount = [
        filters.priority,
        filters.type,
        filters.assigneeId,
        filters.search,
    ].filter(Boolean).length

    const clearFilters = () => {
        onFiltersChange({
            search: '',
            priority: '',
            type: '',
            assigneeId: '',
            view: filters.view,
        })
    }

    const updateFilter = (key: keyof BoardFilters, value: string) => {
        onFiltersChange({ ...filters, [key]: value === 'all' ? '' : value })
    }

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search tickets..."
                    className="pl-8 h-9"
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                />
            </div>

            {/* Filter Popover */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-indigo-500 text-white text-[10px]">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="start">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Filter Tickets</h4>
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-auto py-1 px-2 text-xs text-muted-foreground"
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>

                        {/* Priority Filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</label>
                            <Select
                                value={filters.priority || 'all'}
                                onValueChange={(v) => updateFilter('priority', v)}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="All priorities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="URGENT">🔴 Urgent</SelectItem>
                                    <SelectItem value="HIGH">🟠 High</SelectItem>
                                    <SelectItem value="MEDIUM">🔵 Medium</SelectItem>
                                    <SelectItem value="LOW">🟢 Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type Filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</label>
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(v) => updateFilter('type', v)}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="FEATURE">✨ Feature</SelectItem>
                                    <SelectItem value="BUG">🐛 Bug</SelectItem>
                                    <SelectItem value="TASK">📋 Task</SelectItem>
                                    <SelectItem value="RESEARCH">🔍 Research</SelectItem>
                                    <SelectItem value="LEGAL_REVIEW">✅ Formal / stakeholder review</SelectItem>
                                    <SelectItem value="CLIENT_INTAKE">📝 Client Intake</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assignee Filter */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assignee</label>
                            <Select
                                value={filters.assigneeId || 'all'}
                                onValueChange={(v) => updateFilter('assigneeId', v)}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="All members" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Members</SelectItem>
                                    {assignees.map(a => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Active filter badges */}
            {filters.priority && (
                <Badge variant="secondary" className="gap-1 h-7">
                    Priority: {filters.priority.toLowerCase()}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('priority', '')} />
                </Badge>
            )}
            {filters.type && (
                <Badge variant="secondary" className="gap-1 h-7">
                    Type: {filters.type.replace('_', ' ').toLowerCase()}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter('type', '')} />
                </Badge>
            )}

            {/* View Toggle */}
            <div className="ml-auto flex items-center border rounded-md overflow-hidden">
                {[
                    { view: 'kanban' as const, icon: LayoutGrid, label: 'Kanban' },
                    { view: 'list' as const, icon: LayoutList, label: 'List' },
                    { view: 'table' as const, icon: Table2, label: 'Table' },
                ].map(({ view, icon: Icon, label }) => (
                    <button
                        key={view}
                        onClick={() => updateFilter('view', view)}
                        className={cn(
                            'p-1.5 transition-colors',
                            filters.view === view
                                ? 'bg-indigo-500 text-white'
                                : 'text-muted-foreground hover:bg-muted'
                        )}
                        title={label}
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                ))}
            </div>
        </div>
    )
}
