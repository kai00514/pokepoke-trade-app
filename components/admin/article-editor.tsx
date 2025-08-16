"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Save, Eye, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

import { type Article, type ArticleBlock, createArticle, updateArticle } from "@/lib/actions/admin-articles"
import { ImageUpload } from "./image-upload"
import { BlockEditor } from "./block-editor"
import { ArticlePreview } from "./article-preview"
import { BlockTypeSelector } from "./block-type-selector"

interface ArticleEditorProps {
  article?: Article
  isEditing?: boolean
}

const categories = [
  { value: "news", label: "ニュース" },
  { value: "guide", label: "ガイド" },
  { value: "update", label: "アップデート" },
  { value: "event", label: "イベント" },
  { value: "other", label: "その他" },
]

export function ArticleEditor({ article, isEditing = false }: ArticleEditorProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")

  const [formData, setFormData] = useState<Article>({
    title: article?.title || "",
    slug: article?.slug || "",
    category: article?.category || "news",
    is_published: article?.is_published || false,
    pinned: article?.pinned || false,
    thumbnail_image_url: article?.thumbnail_image_url || "",
    excerpt: article?.excerpt || "",
    blocks: article?.blocks || [],
  })

  // スラッグの自動生成
  useEffect(() => {
    if (!isEditing && formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.title, isEditing])

  const handleInputChange = (field: keyof Article, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBlocksChange = (blocks: ArticleBlock[]) => {
    setFormData((prev) => ({ ...prev, blocks }))
  }

  const addBlock = (type: string) => {
    const newBlock: ArticleBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data: getDefaultBlockData(type),
      order: formData.blocks.length,
    }

    setFormData((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }))
  }

  const getDefaultBlockData = (type: string) => {
    switch (type) {
      case "heading":
        return { text: "", level: 2 }
      case "paragraph":
        return { text: "" }
      case "image":
        return { url: "", alt: "", caption: "", aspect: "16:9" }
      case "list":
        return { items: [""], style: "bulleted" }
      case "table":
        return {
          headers: ["ヘッダー1", "ヘッダー2"],
          rows: [["セル1", "セル2"]],
        }
      case "callout":
        return { body: "", tone: "info", title: "" }
      case "cards-table":
        return {
          items: [
            {
              id: "①",
              card_id: 0,
              quantity: 1,
              explanation: "",
            },
          ],
          headers: {
            id: "番号",
            card: "ポケモンカード",
            quantity: "使用枚数",
            explanation: "役割",
          },
        }
      case "toc":
        return { fromHeadings: true }
      case "evaluation":
        return {
          tier_rank: "1",
          eval_count: 0,
          eval_value: 0,
          max_damage: "",
          stat_stability: "",
          build_difficulty: "",
          stat_accessibility: "",
        }
      case "related-links":
        return {
          items: [{ href: "", label: "" }],
        }
      case "divider":
        return {}
      default:
        return {}
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("タイトルを入力してください")
      return
    }

    if (!formData.slug.trim()) {
      toast.error("スラッグを入力してください")
      return
    }

    console.log("=== DEBUG: Article Editor - handleSave ===")
    console.log("Form data:", JSON.stringify(formData, null, 2))
    console.log("Is editing:", isEditing)
    console.log("Article ID:", article?.id)

    setIsSaving(true)

    try {
      let result
      if (isEditing && article?.id) {
        console.log("=== DEBUG: Updating existing article ===")
        result = await updateArticle(article.id, formData)
      } else {
        console.log("=== DEBUG: Creating new article ===")
        result = await createArticle(formData)
      }

      console.log("=== DEBUG: Save result ===")
      console.log("Result:", result)

      if (result.success) {
        toast.success(isEditing ? "記事を更新しました" : "記事を作成しました")
        router.push("/admin/articles")
      } else {
        console.error("Save failed:", result.error)
        toast.error(result.error || "保存に失敗しました")
      }
    } catch (error) {
      console.error("Save error:", error)
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
      toast.error("保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">{isEditing ? "記事編集" : "記事作成"}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setActiveTab(activeTab === "editor" ? "preview" : "editor")}>
            <Eye className="h-4 w-4 mr-2" />
            {activeTab === "editor" ? "プレビュー" : "エディター"}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">エディター</TabsTrigger>
          <TabsTrigger value="preview">プレビュー</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* メインエディター */}
            <div className="lg:col-span-2 space-y-6">
              {/* 基本情報 */}
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="記事のタイトルを入力"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">スラッグ *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleInputChange("slug", e.target.value)}
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  <div className="space-y-2">
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

              {/* コンテンツブロック */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>コンテンツ</CardTitle>
                    <BlockTypeSelector onSelect={addBlock} />
                  </div>
                </CardHeader>
                <CardContent>
                  <BlockEditor blocks={formData.blocks} onChange={handleBlocksChange} />
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
                  <div className="space-y-2">
                    <Label htmlFor="category">カテゴリー</Label>
                    <Select
                      value={formData.category || "news"}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリーを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="published">公開する</Label>
                    <Switch
                      id="published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => handleInputChange("is_published", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="pinned">ピン留めする</Label>
                    <Switch
                      id="pinned"
                      checked={formData.pinned}
                      onCheckedChange={(checked) => handleInputChange("pinned", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* サムネイル */}
              <Card>
                <CardHeader>
                  <CardTitle>サムネイル画像</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    value={formData.thumbnail_image_url}
                    onChange={(url) => handleInputChange("thumbnail_image_url", url)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <ArticlePreview article={formData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
