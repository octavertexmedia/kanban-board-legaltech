"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Clock, Eye, Pencil, Tag, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { KnowledgeArticle } from "@/lib/types"
import { MarkdownRenderer } from "@/components/common/markdown-renderer"
import { useAuth } from "@/lib/auth-context"
import { CreateArticleDialog } from "@/components/knowledge/create-article-dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const { isAdmin } = useAuth()
  const articleId = typeof params.articleId === "string" ? params.articleId : ""

  const [article, setArticle] = useState<KnowledgeArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadArticle = useCallback(async () => {
    if (!articleId) {
      setLoading(false)
      setFetchError("Invalid article")
      return
    }
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/articles/${articleId}`, { credentials: "include" })
      if (res.status === 404) {
        setArticle(null)
        setFetchError(null)
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to load article")
      }
      const data = await res.json()
      setArticle(data.article)
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load")
      setArticle(null)
    } finally {
      setLoading(false)
    }
  }, [articleId])

  useEffect(() => {
    void loadArticle()
  }, [loadArticle])

  const formattedDate = article
    ? new Date(article.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : ""

  const handleDelete = async () => {
    if (!article) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to delete")
      }
      toast.success("Article deleted")
      router.push("/knowledge")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 p-4 md:p-6 pt-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/knowledge")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>

          {fetchError && !loading ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm">
              {fetchError}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : article ? (
            <>
              <div className="space-y-4 mb-8">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{article.category}</Badge>
                    <div className="flex items-center text-muted-foreground text-sm gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{article.views} views</span>
                    </div>
                  </div>
                  {isAdmin ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>

                <h1 className="text-3xl font-bold">{article.title}</h1>

                <div className="flex items-center gap-3 pt-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={article.author.avatar || "/placeholder.svg"} alt={article.author.name} />
                    <AvatarFallback>{article.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{article.author.name}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="mb-6 border shadow-none">
                <CardContent className="p-4">
                  <MarkdownRenderer content={article.content} />
                </CardContent>
              </Card>

              {article.tags.length > 0 ? (
                <div className="flex items-center gap-2 mt-8">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Article not found</h2>
                <p className="text-muted-foreground mt-2">
                  The article you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => router.push("/knowledge")}>
                  Go back to Knowledge Base
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {article && isAdmin ? (
        <>
          <CreateArticleDialog
            open={editorOpen}
            onOpenChange={setEditorOpen}
            editingArticle={article}
            onArticleUpdate={(updated) => {
              setArticle(updated)
              setEditorOpen(false)
            }}
          />
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this article?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes “{article.title}” from the knowledge base. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  )
}
