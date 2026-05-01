"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { knowledgeCategories } from "@/lib/initial-data"
import { Badge } from "@/components/ui/badge"
import type { KnowledgeArticle } from "@/lib/types"
import { formatKnowledgeMarkdownHtml } from "@/lib/knowledge-markdown"
import { toast } from "sonner"

interface CreateArticleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onArticleCreate?: (article: KnowledgeArticle) => void
  /** When set, the dialog edits this article (workspace admins only on the server). */
  editingArticle?: KnowledgeArticle | null
  onArticleUpdate?: (article: KnowledgeArticle) => void
}

export function CreateArticleDialog({
  open,
  onOpenChange,
  onArticleCreate,
  editingArticle,
  onArticleUpdate,
}: CreateArticleDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("write")

  const isEdit = Boolean(editingArticle)

  useEffect(() => {
    if (!open) return
    if (editingArticle) {
      setTitle(editingArticle.title)
      setContent(editingArticle.content)
      setCategory(editingArticle.category)
      setTags([...editingArticle.tags])
    } else {
      setTitle("")
      setContent("")
      setCategory("")
      setTags([])
    }
    setTagInput("")
    setActiveTab("write")
  }, [open, editingArticle?.id ?? "new"])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isEdit && editingArticle) {
        const response = await fetch(`/api/articles/${editingArticle.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content,
            category,
            tags,
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || "Failed to update article")
        }

        const { article } = await response.json()
        onArticleUpdate?.(article)
        toast.success("Article updated")
        onOpenChange(false)
      } else {
        const response = await fetch("/api/articles", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content,
            category,
            tags,
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || "Failed to create article")
        }

        const { article } = await response.json()
        onArticleCreate?.(article)
        toast.success("Article created")
        onOpenChange(false)
      }
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      const next = tagInput.trim().toLowerCase()
      if (!tags.includes(next)) {
        setTags([...tags, next])
      }
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit knowledge article" : "Create knowledge article"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update this article for your team knowledge base."
                : "Create a new article for your team's knowledge base."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {knowledgeCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Tags
              </Label>
              <div className="col-span-3">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tags (press Enter to add)"
                  className="mb-2"
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-xs hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="content" className="text-right mt-3">
                Content
              </Label>
              <div className="col-span-3 space-y-2">
                <Tabs defaultValue="write" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="write">
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[300px]"
                      placeholder="Write your article content using Markdown..."
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports Markdown formatting: **bold**, *italic*, ## headers, etc.
                    </p>
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="border rounded-md p-4 min-h-[300px] prose prose-sm max-w-none">
                      {content ? (
                        <div dangerouslySetInnerHTML={{ __html: formatKnowledgeMarkdownHtml(content) }} />
                      ) : (
                        <p className="text-muted-foreground">Nothing to preview yet.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#2962FF] hover:bg-[#2962FF]/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Saving…" : "Creating…"}
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create article"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
