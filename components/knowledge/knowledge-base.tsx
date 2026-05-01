"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, BookOpen } from "lucide-react"
import { CreateArticleDialog } from "@/components/knowledge/create-article-dialog"
import { ArticleCard } from "@/components/knowledge/article-card"
import { knowledgeCategories } from "@/lib/initial-data"
import { Badge } from "@/components/ui/badge"
import type { KnowledgeArticle } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export function KnowledgeBase() {
  const { isAdmin } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null)
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const categoryOptions = useMemo(() => {
    const fromDb = new Set(articles.map((a) => a.category))
    return [...new Set([...knowledgeCategories, ...fromDb])].sort()
  }, [articles])

  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch("/api/articles", { credentials: "include" })
        if (response.ok) {
          const data = await response.json()
          setArticles(Array.isArray(data.articles) ? data.articles : [])
        }
      } catch (error) {
        console.error("Failed to fetch articles:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchArticles()
  }, [])

  const openCreate = () => {
    setEditingArticle(null)
    setIsEditorOpen(true)
  }

  const openEdit = (article: KnowledgeArticle) => {
    setEditingArticle(article)
    setIsEditorOpen(true)
  }

  const handleEditorOpenChange = (open: boolean) => {
    setIsEditorOpen(open)
    if (!open) setEditingArticle(null)
  }

  const handleCreateArticle = (newArticle: KnowledgeArticle) => {
    setArticles((prev) => [newArticle, ...prev])
  }

  const handleArticleUpdate = (updated: KnowledgeArticle) => {
    setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  const handleArticleDeleted = (articleId: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== articleId))
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = activeCategory ? article.category === activeCategory : true

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground">Browse articles and resources for your team</p>
        </div>
        {isAdmin ? (
          <Button onClick={openCreate} className="bg-[#2962FF] hover:bg-[#2962FF]/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Article
          </Button>
        ) : null}
      </div>

      <div className="flex items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search knowledge base..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/90"
          onClick={() => setActiveCategory(null)}
        >
          All Categories
        </Badge>
        {categoryOptions.map((category) => (
          <Badge
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/90"
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading articles…</p>
      ) : filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              canManage={isAdmin}
              onEdit={openEdit}
              onDeleted={handleArticleDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No articles found</h3>
          <p className="text-muted-foreground text-center mt-2">
            {searchQuery
              ? "Try adjusting your search or filter criteria."
              : isAdmin
                ? "Create your first knowledge article."
                : "No articles yet. Ask an admin to add content."}
          </p>
        </div>
      )}

      <CreateArticleDialog
        open={isEditorOpen}
        onOpenChange={handleEditorOpenChange}
        onArticleCreate={handleCreateArticle}
        editingArticle={editingArticle}
        onArticleUpdate={handleArticleUpdate}
      />
    </div>
  )
}
