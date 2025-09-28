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
  const [formData, setFormData] = useState({
    title: article?.title || "",
    slug: article?.slug || "",
    category: article?.category || "news",
    excerpt: article?.excerpt || "",
    thumbnail_image_url: article?.featured_image || "",
    is_published: article?.is_published || false,
    blocks: article?.blocks || [],
  })
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // タイトルからスラッグを自動生成
  useEffect(() => {
    if (!isEditing && formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      setFormData({ ...formData, slug: generatedSlug })
    }
  }, [isEditing, formData.title]) // Updated dependency array

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleBlocksChange = (newBlocks: Block[]) => {
    setFormData({ ...formData, blocks: newBlocks })
  }

  const handleSave = async (silent = false) => {
    if (!formData.title || !formData.slug || !formData.category) {
      toast({
        title: "エラー",
        description: "タイトル、スラッグ、カテゴリーは必須です",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("title", formData.title)
      formDataToSend.append("slug", formData.slug)
      formDataToSend.append("category", formData.category)
      formDataToSend.append("excerpt", formData.excerpt || "")
      formDataToSend.append("featured_image", formData.thumbnail_image_url || "")
      formDataToSend.append("is_published", formData.is_published.toString())
      formDataToSend.append("blocks", JSON.stringify(formData.blocks))

      let result
      if (isEditing && article?.id) {
        result = await updateArticle(article.id, formDataToSend)
      } else {
        result = await createArticle(formDataToSend)
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
    title: formData.title,
    slug: formData.slug,
    category: formData.category,
    excerpt: formData.excerpt,
    featured_image: formData.thumbnail_image_url,
    is_published: formData.is_published,
    published_at: new Date().toISOString(),
    pinned: false,
    priority: 0,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    blocks: formData.blocks,
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
          <Button onClick={() => handleSave()} disabled={isSaving}>
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
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="記事のタイトルを入力"
                />
              </div>
              <div>
                <Label htmlFor="slug">スラッグ *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="記事のスラッグを入力"
                />
              </div>
              <div>
                <Label htmlFor="excerpt">概要</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange("excerpt", e.target.value)}
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
              {formData.blocks.map((block, index) => (
                <div key={block.id}>
                  <BlockEditor
                    block={block}
                    onUpdate={(data) =>
                      handleBlocksChange(formData.blocks.map((b) => (b.id === block.id ? { ...b, data } : b)))
                    }
                    onDelete={() => handleBlocksChange(formData.blocks.filter((b) => b.id !== block.id))}
                    onMoveUp={
                      index > 0
                        ? () =>
                            handleBlocksChange([
                              ...formData.blocks.slice(0, index - 1),
                              formData.blocks[index],
                              formData.blocks[index - 1],
                              ...formData.blocks.slice(index + 1),
                            ])
                        : undefined
                    }
                    onMoveDown={
                      index < formData.blocks.length - 1
                        ? () =>
                            handleBlocksChange([
                              ...formData.blocks.slice(0, index),
                              formData.blocks[index + 1],
                              formData.blocks[index],
                              ...formData.blocks.slice(index + 2),
                            ])
                        : undefined
                    }
                  />
                  {index < formData.blocks.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
              <BlockTypeSelector
                onSelectType={(type) =>
                  handleBlocksChange([
                    ...formData.blocks,
                    {
                      id: `block-${Date.now()}`,
                      type,
                      data: {},
                      display_order: (formData.blocks.length + 1) * 10,
                    },
                  ])
                }
              />
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
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
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
                <Switch
                  id="published"
                  checked={formData.is_published}
                  onCheckedChange={(value) => handleInputChange("is_published", value)}
                />
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
                  value={formData.thumbnail_image_url}
                  onChange={(e) => handleInputChange("thumbnail_image_url", e.target.value)}
                  placeholder="画像のURLを入力"
                />
              </div>
              {formData.thumbnail_image_url && (
                <div className="mt-2">
                  <img
                    src={formData.thumbnail_image_url || "/placeholder.svg"}
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
