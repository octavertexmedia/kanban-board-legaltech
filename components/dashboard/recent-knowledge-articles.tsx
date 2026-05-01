"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, BookMarked, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { KnowledgeArticle } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export function RecentKnowledgeArticles() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false)
      return
    }
    fetch("/api/articles?limit=3", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { articles: [] }))
      .then((data) => setArticles(data.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  return (
    <Card className="border border-border shadow-none">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-3 space-y-0">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <BookMarked className="h-3.5 w-3.5 text-muted-foreground" />
          Knowledge base
        </CardTitle>
        <Link href="/knowledge">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] gap-0.5 text-muted-foreground hover:text-foreground">
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 rounded border border-border animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-2">
            {articles.map((article) => (
              <Link href={`/knowledge/${article.id}`} key={article.id}>
                <div className="rounded border border-border bg-background px-2.5 py-2 hover:bg-muted/40 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium">
                      {article.category}
                    </Badge>
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {article.views}
                    </div>
                  </div>
                  <h3 className="text-xs font-medium line-clamp-1">{article.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs font-medium text-foreground">No articles yet</p>
            <p className="text-[11px] text-muted-foreground mt-1">Docs will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
