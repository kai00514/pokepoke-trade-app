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
import { Save, Eye, ArrowLeft, FileText, Settings } from "lucide-react"
import { toast } from "sonner"

import { type CreateArticleData, type ArticleBlock, createArticle, updateArticle } from "@/lib/actions/admin-articles"
import { ImageUpload } from "./image-upload"
import { BlockEditor } from "./block-editor"
import { ArticlePreview } from "./article-preview"
import { BlockTypeSelector } from "./block-type-selector"

interface Article extends CreateArticleData {
  id?: string
  created_at?: string
  updated_at?: string
  view_count?: number
}

interface ArticleEditorProps {
  article?: Article
  isEditing?: boolean
}

const categories = [
  { value: "news", label: "ニュース" },
  { value: "guide", label: "ガイド" },
  { value: "update", label: "アップデート" },
  { value: "event", label: "イベント" },
  { value: "deck", label: "デッキ" },
  { value: "card", label: "カード" },
  { value: "other", label: "その他" },
]

export function ArticleEditor({ article, isEditing = false }: ArticleEditorProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [autoSave, setAutoSave] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [formData, setFormData] = useState<CreateArticleData>({
    title: article?.title || "",
    slug: article?.slug || "",
    category: article?.category || "news",
    is_published: article?.is_published || false,
    pinned: article?.pinned || false,
    priority: article?.priority || 0,
    thumbnail_image_url: article?.thumbnail_image_url || "",
    hero_image_url: article?.hero_image_url || "",
    excerpt: article?.excerpt || "",
    subtitle: article?.subtitle || "",
    tags: article?.tags || [],
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

  // 自動保存
  useEffect(() => {
    if (!autoSave || !isEditing || !article?.id) return

    const timer = setTimeout(() => {
      handleSave(true) // silent save
    }, 30000) // 30秒後に自動保存

    return () => clearTimeout(timer)
  }, [formData, autoSave, isEditing, article?.id])

  const handleInputChange = (field: keyof CreateArticleData, value: any) => {
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
      display_order: formData.blocks.length * 10 + 10,
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
      case "rich-text":
        defaultData = { content: "", format: "markdown" }
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
      case "flexible-table":
        defaultData = {
          columns: [
            { id: "col1", header: "列1", width: "auto", type: "text" },
            { id: "col2", header: "列2", width: "auto", type: "text" },
          ],
          rows: [{ id: "row1", cells: { col1: "", col2: "" } }],
          style: "default",
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
      case "card-display-table":
        defaultData = {
          rows: [
            {
              id: `row-${Date.now()}`,
              header: "ヘッダー1",
              cards: [],
            },
          ],
        }
        break
      case "media-gallery":
        defaultData = {
          items: [],
          layout: "grid",
          columns: 3,
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
      case "pickup":
        defaultData = {
          title: "",
          items: [{ title: "", url: "" }],
        }
        break
      case "button":
        defaultData = {
          text: "ボタン",
          url: "",
          style: "primary",
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

  const handleSave = async (silent = false) => {
    console.log("=== DEBUG: ArticleEditor - handleSave started ===")
    console.log("Current form data:", JSON.stringify(formData, null, 2))
    console.log("Is editing:", isEditing)
    console.log("Article ID:", article?.id)
    console.log("Silent save:", silent)

    // バリデーション
    if (!formData.title.trim()) {
      console.log("ERROR: Title is empty")
      if (!silent) toast.error("タイトルを入力してください")
      return
    }

    if (!formData.slug.trim()) {
      console.log("ERROR: Slug is empty")
      if (!silent) toast.error("スラッグを入力してください")
      return
    }

    if (!formData.category) {
      console.log("ERROR: Category is empty")
      if (!silent) toast.error("カテゴリーを選択してください")
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
        setLastSaved(new Date())
        if (!silent) {
          toast.success(isEditing ? "記事を更新しました" : "記事を作成しました")
          if (!isEditing) {
            // 記事作成後は記事一覧に戻る
            router.push("/admin/articles")
            // キャッシュを更新してユーザー側にも反映
            router.refresh()
          }
        }
      } else {
        console.error("=== DEBUG: Save failed ===")
        console.error("Error message:", result.error)
        if (!silent) toast.error(result.error || "保存に失敗しました")
      }
    } catch (error) {
      console.error("=== DEBUG: Exception in handleSave ===")
      console.error("Error message:", error instanceof Error ? error.message : "Unknown error")
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
      console.error("Full error object:", error)
      if (!silent) toast.error("保存中にエラーが発生しました")
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
          {lastSaved && <span className="text-sm text-slate-500">最終保存: {lastSaved.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-save" className="text-sm">
              自動保存
            </Label>
            <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} size="sm" />
          </div>
          <Button variant="outline" onClick={() => setActiveTab(activeTab === "editor" ? "preview" : "editor")}>
            <Eye className="h-4 w-4 mr-2" />
            {activeTab === "editor" ? "プレビュー" : "エディター"}
          </Button>
          <Button onClick={() => handleSave(false)} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            エディター
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            設定
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            プレビュー
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* メインエディター */}
            <div className="lg:col-span-3 space-y-6">
              {/* 基本情報 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    基本情報
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">タイトル *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="記事のタイトルを入力"
                        className="font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug">スラッグ *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => handleInputChange("slug", e.target.value)}
                        placeholder="url-friendly-slug"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">サブタイトル</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => handleInputChange("subtitle", e.target.value)}
                      placeholder="記事のサブタイトル（任意）"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">概要</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange("excerpt", e.target.value)}
                      placeholder="記事の概要を入力（SEO対策にも重要です）"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* コンテンツブロック */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      コンテンツ ({formData.blocks.length}ブロック)
                    </CardTitle>
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
                  <CardTitle className="text-base">公開設定</CardTitle>
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
                    <div>
                      <Label htmlFor="published" className="font-medium">
                        公開する
                      </Label>
                      <p className="text-xs text-slate-500">記事を一般公開します</p>
                    </div>
                    <Switch
                      id="published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => handleInputChange("is_published", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pinned" className="font-medium">
                        ピン留めする
                      </Label>
                      <p className="text-xs text-slate-500">記事を上部に固定表示</p>
                    </div>
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
                  <CardTitle className="text-base">サムネイル画像</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    value={formData.thumbnail_image_url}
                    onChange={(url) => handleInputChange("thumbnail_image_url", url)}
                  />
                  <p className="text-xs text-slate-500 mt-2">推奨サイズ: 1200x630px (16:9)</p>
                </CardContent>
              </Card>

              {/* ヒーロー画像 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">ヒーロー画像</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    value={formData.hero_image_url}
                    onChange={(url) => handleInputChange("hero_image_url", url)}
                  />
                  <p className="text-xs text-slate-500 mt-2">記事上部に表示される大きな画像</p>
                </CardContent>
              </Card>

              {/* 統計情報（編集時のみ） */}
              {isEditing && article && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">統計情報</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">作成日:</span>
                      <span>{new Date(article.created_at || "").toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">更新日:</span>
                      <span>{new Date(article.updated_at || "").toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">閲覧数:</span>
                      <span>{article.view_count || 0}回</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>詳細設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SEO設定</Label>
                <p className="text-sm text-slate-600">検索エンジン最適化の設定</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-description">メタディスクリプション</Label>
                <Textarea
                  id="meta-description"
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange("excerpt", e.target.value)}
                  placeholder="検索結果に表示される説明文（160文字以内推奨）"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-slate-500">{formData.excerpt?.length || 0}/160文字</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>タグ設定</Label>
                <p className="text-sm text-slate-600">記事に関連するタグ（カンマ区切り）</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">タグ</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "tags",
                      e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="タグ1, タグ2, タグ3"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>表示設定</Label>
                <p className="text-sm text-slate-600">記事の表示に関する設定</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">優先度</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.priority || 0}
                  onChange={(e) => handleInputChange("priority", Number.parseInt(e.target.value) || 0)}
                  placeholder="0-100（数値が大きいほど優先表示）"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <ArticlePreview article={formData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
