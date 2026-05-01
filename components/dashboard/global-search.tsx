"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Search, FileText, Ticket, CalendarDays, Users, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type SearchResult = {
  id: string
  title: string
  type: "project" | "ticket" | "meeting" | "article" | "user"
  url: string
  icon: React.ElementType
}

interface GlobalSearchProps {
  /** Dense trigger for dashboard header (Jira-style). */
  variant?: "default" | "compact"
  className?: string
}

export function GlobalSearch({ variant = "default", className }: GlobalSearchProps) {
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const compact = variant === "compact"

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault()

        if (window.innerWidth < 768) {
          setMobileOpen(true)
        } else {
          setOpen(true)
        }
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if ((open || mobileOpen) && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open, mobileOpen])

  useEffect(() => {
    if (query.length > 1) {
      setIsLoading(true)

      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
          const data = await res.json()

          const iconMap: Record<string, React.ElementType> = {
            project: FileText,
            ticket: Ticket,
            meeting: CalendarDays,
            article: FileText,
            user: Users,
          }

          const mappedResults: SearchResult[] = (data.results || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            url: r.url,
            icon: iconMap[r.type] || FileText,
            subtitle: r.subtitle,
          }))

          setResults(mappedResults)
        } catch (error) {
          console.error("Search error:", error)
          setResults([])
        } finally {
          setIsLoading(false)
        }
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setResults([])
    }
  }, [query])

  const handleSelect = (item: SearchResult) => {
    setOpen(false)
    setMobileOpen(false)
    router.push(item.url)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "project":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "ticket":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
      case "meeting":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "article":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "user":
        return "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const SearchContent = (
    <Command className="rounded-lg border shadow-md">
      <div className={cn("flex items-center border-b px-3", compact && "px-2")}>
        <Search className={cn("shrink-0 opacity-50 mr-2", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        <CommandInput
          ref={inputRef}
          placeholder="Search projects, tickets, meetings…"
          value={query}
          onValueChange={setQuery}
          className={cn("flex-1 outline-none", compact ? "py-2 text-sm" : "py-3")}
        />
        {query ? (
          <Button variant="ghost" size="icon" onClick={() => setQuery("")} className="h-6 w-6 shrink-0">
            <X className="h-3 w-3" />
          </Button>
        ) : null}
      </div>
      <CommandList>
        {isLoading && (
          <div className={cn("text-center text-muted-foreground", compact ? "py-4 text-xs" : "py-6 text-sm")}>
            <div className="animate-pulse">Searching…</div>
          </div>
        )}
        {!isLoading && query && !results.length && <CommandEmpty>No results found.</CommandEmpty>}
        {!isLoading && !query && (
          <div className={cn("px-2 text-center text-muted-foreground", compact ? "py-3 text-xs" : "py-4 text-sm")}>
            Type to search. Shortcut: ⌘K
          </div>
        )}
        {results.length > 0 && (
          <CommandGroup heading="Results">
            {results.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                onSelect={() => handleSelect(item)}
                className={cn("cursor-pointer", compact && "text-sm py-2")}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("p-1 rounded shrink-0", getTypeColor(item.type))}>
                    <item.icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                  </div>
                  <span className="truncate">{item.title}</span>
                </div>
                <span className="ml-auto text-[10px] capitalize text-muted-foreground shrink-0">{item.type}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )

  const triggerClass = compact
    ? "h-8 w-full justify-start gap-2 border-border bg-background text-xs font-normal text-muted-foreground hover:bg-muted/50"
    : "w-full justify-between bg-white/90 dark:bg-gray-800/90 border-white/20 text-left font-normal"

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className={triggerClass}>
            <div className="flex items-center gap-2 min-w-0">
              <Search className={cn("shrink-0 opacity-60", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              <span className="line-clamp-1">{compact ? "Search…" : "Search..."}</span>
            </div>
            <kbd className="hidden sm:inline-flex pointer-events-none h-5 items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ⌘K
            </kbd>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[calc(100vw-2rem)] max-w-lg" align="start">
          {SearchContent}
        </PopoverContent>
      </Popover>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0">{SearchContent}</DialogContent>
      </Dialog>
    </div>
  )
}
