"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Save, Eye, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { createArticle, updateArticle, type Article, type Block } from "@/lib/actions/admin-articles"
import { BlockEditor } from "./block-editor"
import { BlockTypeSelector } from "./block-type-selector"
import { ArticlePreview } from "./article-preview"

interface ArticleEditorProps {
  article?: Article
  isEditing?: boolean
}

export function ArticleEditor({ article, isEditing = false }: ArticleEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(article?.title || "")
  const [slug, setSlug] = useState(article?.slug || "")
  const [category, setCategory] = useState(article?.category || "news")
  const [excerpt, setExcerpt] = useState(article?.excerpt || "")
  const [featuredImage, setFeaturedImage] = useState(article?.featured_image || "")
  const [isPublished, setIsPublished] = useState(article?.is_published || false)
  const [blocks, setBlocks] = useState<Block[]>(article?.blocks || [])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // タイトルからスラッグを自動生成
  useEffect(() => {
    if (!isEditing && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      setSlug(generatedSlug)
    }
  }, [title, slug, isEditing])

  const handleAddBlock = (type: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      data: {},
      display_order: (blocks.length + 1) * 10,
    }
    setBlocks([...blocks, newBlock])
  }

  const handleUpdateBlock = (blockId: string, data: any) => {
    setBlocks(blocks.map((block) => (block.id === blockId ? { ...block, data } : block)))
  }

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((block) => block.id !== blockId))
  }

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    const blockIndex = blocks.findIndex((block) => block.id === blockId)
    if (blockIndex === -1) return

    const newBlocks = [...blocks]
    if (direction === "up" && blockIndex > 0) {
      ;[newBlocks[blockIndex], newBlocks[blockIndex - 1]] = [newBlocks[blockIndex - 1], newBlocks[blockIndex]]
    } else if (direction === "down" && blockIndex < blocks.length - 1) {
      ;[newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]]
    }

    // display_orderを再設定
    newBlocks.forEach((block, index) => {
      block.display_order = (index + 1) * 10
    })

    setBlocks(newBlocks)
  }

  const handleSave = async () => {
    if (!title || !slug || !category) {
      toast({
        title: "エラー",
        description: "タイトル、スラッグ、カテゴリーは必須です",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("slug", slug)
      formData.append("category", category)
      formData.append("excerpt", excerpt)
      formData.append("featured_image", featuredImage)
      formData.append("is_published", isPublished.toString())
      formData.append("blocks", JSON.stringify(blocks))

      let result
      if (isEditing && article?.id) {
        result = await updateArticle(article.id, formData)
      } else {
        result = await createArticle(formData)
      }

      if (result.success) {
        toast({
          title: "成功",
          description: isEditing ? "記事を更新しました" : "記事を作成しました",
        })
        router.push("/admin/articles")
      } else {
        toast({
          title: "エラー",
          description: result.error || "記事の保存に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "エラー",
        description: "記事の保存中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const previewArticle: Article = {
    id: article?.id || "preview",
    title,
    slug,
    category,
    excerpt,
    featured_image: featuredImage,
    is_published: isPublished,
    published_at: new Date().toISOString(),
    pinned: false,
    priority: 0,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    blocks,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin/articles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{isEditing ? "記事編集" : "記事作成"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            プレビュー
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="記事のタイトルを入力"
                />
              </div>
              <div>
                <Label htmlFor="slug">スラッグ *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="記事のスラッグを入力"
                />
              </div>
              <div>
                <Label htmlFor="excerpt">概要</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="記事の概要を入力"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* ブロック */}
          <Card>
            <CardHeader>
              <CardTitle>コンテンツブロック</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {blocks.map((block, index) => (
                <div key={block.id}>
                  <BlockEditor
                    block={block}
                    onUpdate={(data) => handleUpdateBlock(block.id!, data)}
                    onDelete={() => handleDeleteBlock(block.id!)}
                    onMoveUp={index > 0 ? () => handleMoveBlock(block.id!, "up") : undefined}
                    onMoveDown={index < blocks.length - 1 ? () => handleMoveBlock(block.id!, "down") : undefined}
                  />
                  {index < blocks.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
              <BlockTypeSelector onSelectType={handleAddBlock} />
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 公開設定 */}
          <Card>
            <CardHeader>
              <CardTitle>公開設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">カテゴリー *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">ニュース</SelectItem>
                    <SelectItem value="guide">ガイド</SelectItem>
                    <SelectItem value="update">アップデート</SelectItem>
                    <SelectItem value="event">イベント</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
                <Label htmlFor="published">公開する</Label>
              </div>
            </CardContent>
          </Card>

          {/* アイキャッチ画像 */}
          <Card>
            <CardHeader>
              <CardTitle>アイキャッチ画像</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="featured-image">画像URL</Label>
                <Input
                  id="featured-image"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="画像のURLを入力"
                />
              </div>
              {featuredImage && (
                <div className="mt-2">
                  <img
                    src={featuredImage || "/placeholder.svg"}
                    alt="アイキャッチ画像"
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* プレビューモーダル */}
      <ArticlePreview article={previewArticle} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
    </div>
  )
}
