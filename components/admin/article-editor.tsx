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

  console.log("=== DEBUG: ArticleEditor component initialized ===")
  console.log("Initial article:", JSON.stringify(article, null, 2))
  console.log("Is editing:", isEditing)
  console.log("Initial form data:", JSON.stringify(formData, null, 2))

  // スラッグの自動生成
  useEffect(() => {
    if (!isEditing && formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")

      console.log("=== DEBUG: Auto-generating slug ===")
      console.log("Title:", formData.title)
      console.log("Generated slug:", slug)

      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.title, isEditing])

  const handleInputChange = (field: keyof Article, value: any) => {
    console.log("=== DEBUG: Input change ===")
    console.log("Field:", field)
    console.log("Value:", value)
    console.log("Value type:", typeof value)

    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      console.log("New form data:", JSON.stringify(newData, null, 2))
      return newData
    })
  }

  const handleBlocksChange = (blocks: ArticleBlock[]) => {
    console.log("=== DEBUG: Blocks change ===")
    console.log("New blocks count:", blocks.length)
    console.log("New blocks:", JSON.stringify(blocks, null, 2))

    setFormData((prev) => ({ ...prev, blocks }))
  }

  const addBlock = (type: string) => {
    console.log("=== DEBUG: Adding block ===")
    console.log("Block type:", type)

    const newBlock: ArticleBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data: getDefaultBlockData(type),
      order: formData.blocks.length,
    }

    console.log("New block:", JSON.stringify(newBlock, null, 2))

    setFormData((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }))
  }

  const getDefaultBlockData = (type: string) => {
    console.log("=== DEBUG: Getting default block data for type:", type)

    let defaultData
    switch (type) {
      case "heading":
        defaultData = { text: "", level: 2 }
        break
      case "paragraph":
        defaultData = { text: "" }
        break
      case "image":
        defaultData = { url: "", alt: "", caption: "", aspect: "16:9" }
        break
      case "list":
        defaultData = { items: [""], style: "bulleted" }
        break
      case "table":
        defaultData = {
          headers: ["ヘッダー1", "ヘッダー2"],
          rows: [["セル1", "セル2"]],
        }
        break
      case "callout":
        defaultData = { body: "", tone: "info", title: "" }
        break
      case "cards-table":
        defaultData = {
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
        break
      case "toc":
        defaultData = { fromHeadings: true }
        break
      case "evaluation":
        defaultData = {
          tier_rank: "1",
          eval_count: 0,
          eval_value: 0,
          max_damage: "",
          stat_stability: "",
          build_difficulty: "",
          stat_accessibility: "",
        }
        break
      case "related-links":
        defaultData = {
          items: [{ href: "", label: "" }],
        }
        break
      case "divider":
        defaultData = {}
        break
      default:
        defaultData = {}
    }

    console.log("Default data for", type, ":", JSON.stringify(defaultData, null, 2))
    return defaultData
  }

  const handleSave = async () => {
    console.log("=== DEBUG: ArticleEditor - handleSave started ===")
    console.log("Current form data:", JSON.stringify(formData, null, 2))
    console.log("Is editing:", isEditing)
    console.log("Article ID:", article?.id)

    // バリデーション
    if (!formData.title.trim()) {
      console.log("ERROR: Title is empty")
      toast.error("タイトルを入力してください")
      return
    }

    if (!formData.slug.trim()) {
      console.log("ERROR: Slug is empty")
      toast.error("スラッグを入力してください")
      return
    }

    if (!formData.category) {
      console.log("ERROR: Category is empty")
      toast.error("カテゴリーを選択してください")
      return
    }

    console.log("=== DEBUG: Validation passed ===")
    console.log("Title:", formData.title)
    console.log("Slug:", formData.slug)
    console.log("Category:", formData.category)

    setIsSaving(true)

    try {
      let result
      if (isEditing && article?.id) {
        console.log("=== DEBUG: Updating existing article ===")
        console.log("Article ID to update:", article.id)
        result = await updateArticle(article.id, formData)
      } else {
        console.log("=== DEBUG: Creating new article ===")
        result = await createArticle(formData)
      }

      console.log("=== DEBUG: Save operation result ===")
      console.log("Result success:", result.success)
      console.log("Result data:", JSON.stringify(result.data, null, 2))
      console.log("Result error:", result.error)

      if (result.success) {
        console.log("=== DEBUG: Save successful ===")
        toast.success(isEditing ? "記事を更新しました" : "記事を作成しました")
        router.push("/admin/articles")
      } else {
        console.error("=== DEBUG: Save failed ===")
        console.error("Error message:", result.error)
        toast.error(result.error || "保存に失敗しました")
      }
    } catch (error) {
      console.error("=== DEBUG: Exception in handleSave ===")
      console.error("Error message:", error instanceof Error ? error.message : "Unknown error")
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
      console.error("Full error object:", error)
      toast.error("保存中にエラーが発生しました")
    } finally {
      console.log("=== DEBUG: Setting isSaving to false ===")
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
