"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, BookOpen } from "lucide-react"
import { CreateArticleDialog } from "@/components/knowledge/create-article-dialog"
import { ArticleCard } from "@/components/knowledge/article-card"
import { initialKnowledgeArticles, knowledgeCategories } from "@/lib/initial-data"
import { Badge } from "@/components/ui/badge"
import type { KnowledgeArticle } from "@/lib/types"

export function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [articles, setArticles] = useState<KnowledgeArticle[]>(initialKnowledgeArticles)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)



  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch('/api/articles')
        if (response.ok) {
          const data = await response.json()
          if (data.articles && data.articles.length > 0) {
            setArticles(data.articles)
          }
        }
      } catch (error) {
        console.error("Failed to fetch articles:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchArticles()
  }, [])

  const handleCreateArticle = (newArticle: KnowledgeArticle) => {
    setArticles([newArticle, ...articles])
  }

  // Filter articles by search query and category
  const filteredArticles = articles.filter(article => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

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
        <Button onClick={() => setIsCreateOpen(true)} className="bg-[#2962FF] hover:bg-[#2962FF]/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Article
        </Button>
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
        {knowledgeCategories.map(category => (
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

      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No articles found</h3>
          <p className="text-muted-foreground text-center mt-2">
            {searchQuery
              ? "Try adjusting your search or filter criteria."
              : "Start by creating your first knowledge article."}
          </p>
        </div>
      )}

      <CreateArticleDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onArticleCreate={handleCreateArticle}
      />
    </div>
  )
}
