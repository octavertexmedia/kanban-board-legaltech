"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { initialKnowledgeArticles } from "@/lib/initial-data"
import Link from "next/link"
import { ArrowRight, Eye } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function RecentKnowledgeArticles() {
  // Sort by the most recent and get top 3
  const articles = [...initialKnowledgeArticles]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  return (
    <Card className="border-0 shadow-xl shadow-black/5 ring-1 ring-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
          </div>
          Knowledge Base
        </CardTitle>
        <Link href="/knowledge">
          <Button variant="ghost" size="sm" className="gap-1 hover:bg-pink-500/10 hover:text-pink-600 transition-colors">
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {articles.length > 0 ? (
          <div className="space-y-3">
            {articles.map((article) => (
              <Link href={`/knowledge/${article.id}`} key={article.id}>
                <div className="group relative bg-card hover:bg-muted/40 border border-border/50 p-3.5 rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="outline" className="bg-pink-500/10 text-pink-600 border-pink-500/20 text-[10px] uppercase tracking-wider font-bold">
                      {article.category}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                      <Eye className="h-3 w-3" />
                      <span className="font-medium">{article.views}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5 group-hover:text-pink-600 transition-colors line-clamp-1">{article.title}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] font-medium text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                      {article.tags.length > 2 && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md">
                          +{article.tags.length - 2}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl opacity-50">📚</span>
            </div>
            <p className="font-medium text-foreground">No knowledge articles</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Start documenting your processes</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
