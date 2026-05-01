"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Eye, Clock, MoreHorizontal } from "lucide-react"
import type { KnowledgeArticle } from "@/lib/types"
import { toast } from "sonner"

interface ArticleCardProps {
  article: KnowledgeArticle
  canManage?: boolean
  onEdit?: (article: KnowledgeArticle) => void
  onDeleted?: (articleId: string) => void
}

export function ArticleCard({ article, canManage, onEdit, onDeleted }: ArticleCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const formattedDate = new Date(article.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const handleDelete = async () => {
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
      onDeleted?.(article.id)
      setDeleteOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative h-full">
      {canManage && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 shadow-sm"
                aria-label="Article actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  onEdit?.(article)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.preventDefault()
                  setDeleteOpen(true)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <Link href={`/knowledge/${article.id}`} className="block h-full">
        <Card className="h-full overflow-hidden transition-all hover:shadow-md cursor-pointer">
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start gap-8 pr-6">
              <Badge variant="outline">{article.category}</Badge>
              <div className="flex items-center text-muted-foreground text-xs gap-1 shrink-0">
                <Eye className="h-3 w-3" />
                <span>{article.views}</span>
              </div>
            </div>
            <h3 className="font-semibold text-lg mt-2">{article.title}</h3>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-muted-foreground text-sm line-clamp-3">
              {article.content.replace(/#|##|###|\*\*|\*/g, "").substring(0, 150)}...
            </p>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={article.author.avatar || "/placeholder.svg"} alt={article.author.name} />
                <AvatarFallback>{article.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{article.author.name}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formattedDate}</span>
            </div>
          </CardFooter>
        </Card>
      </Link>

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
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
