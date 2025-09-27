"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, GripVertical, Eye, Save, ArrowLeft } from "lucide-react"
import { BlockEditor } from "./block-editor"
import { ArticlePreview } from "./article-preview"
import { createAdminArticle, updateAdminArticle, type AdminArticle } from "@/lib/actions/admin-articles"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Block {
  id: string
  type: string
  display_order: number
  data: any
}

interface ArticleEditorProps {
  article?: AdminArticle
  isEditing?: boolean
}

function getDefaultBlockData(type: string): any {
  switch (type) {
    case "heading":
      return { level: 2, text: "" }
    case "paragraph":
      return { text: "" }
    case "image":
      return { url: "", alt: "", caption: "" }
    case "list":
      return { style: "bulleted", items: [""] }
    case "table":
      return { headers: [""], rows: [[""]] }
    case "callout":
      return { tone: "info", text: "", title: "" }
    case "evaluation":
      return {
        tier_rank: "",
        max_damage: "",
        build_difficulty: "",
        stat_accessibility: "",
        stat_stability: "",
        eval_value: 0,
        eval_count: 0,
      }
    case "cards-table":
      return { items: [], headers: { id: "ID", card: "カード", explanation: "説明", quantity: "枚数" } }
    case "card-display-table":
      return { rows: [] }
    case "flexible-table":
      return {
        rows: [
          {
            id: "row1",
            cells: [
              { id: "cell1-1", type: "text", value: "" },
              { id: "cell1-2", type: "text", value: "" },
            ],
          },
        ],
        style: "default",
        maxColumns: 2,
      }
    case "pickup":
      return {
        title: "ピックアップ情報",
        items: [{ label: "", href: "" }],
      }
    case "button":
      return { label: "ボタン", href: "" }
    case "toc":
      return { fromHeadings: true }
    case "related-links":
      return { items: [{ href: "", label: "" }] }
    case "divider":
      return {}
    default:
      return {}
  }
}

export function ArticleEditor({ article, isEditing = false }: ArticleEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(article?.title || "")
  const [slug, setSlug] = useState(article?.slug || "")
  const [excerpt, setExcerpt] = useState(article?.excerpt || "")
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState(article?.thumbnail_image_url || "")
  const [category, setCategory] = useState(article?.category || "")
  const [tags, setTags] = useState<string[]>(article?.tags || [])
  const [newTag, setNewTag] = useState("")
  const [isPublished, setIsPublished] = useState(article?.is_published || false)
  const [publishedAt, setPublishedAt] = useState(
    article?.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : "",
  )
  const [pinned, setPinned] = useState(article?.pinned || false)
  const [priority, setPriority] = useState(article?.priority || 0)
  const [blocks, setBlocks] = useState<Block[]>(
    article?.blocks?.map((block, index) => ({
      id: `block-${index}`,
      type: block.type,
      display_order: block.display_order,
      data: block.data,
    })) || [],
  )
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const addBlock = (type: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      display_order: blocks.length,
      data: getDefaultBlockData(type),
    }
    setBlocks([...blocks, newBlock])
  }

  const updateBlock = (blockId: string, data: any) => {
    setBlocks(blocks.map((block) => (block.id === blockId ? { ...block, data } : block)))
  }

  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((block) => block.id !== blockId))
  }

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const blockIndex = blocks.findIndex((block) => block.id === blockId)
    if (blockIndex === -1) return

    const newBlocks = [...blocks]
    const targetIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1

    if (targetIndex < 0 || targetIndex >= newBlocks.length) return
    ;[newBlocks[blockIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[blockIndex]]

    // Update display_order
    newBlocks.forEach((block, index) => {
      block.display_order = index
    })

    setBlocks(newBlocks)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("タイトルを入力してください")
      return
    }

    setIsSaving(true)

    try {
      const articleData = {
        title: title.trim(),
        slug: slug.trim() || null,
        excerpt: excerpt.trim() || null,
        thumbnail_image_url: thumbnailImageUrl.trim() || null,
        category: category.trim() || null,
        tags: tags.length > 0 ? tags : null,
        is_published: isPublished,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        pinned,
        priority,
        blocks: blocks.map((block) => ({
          type: block.type,
          display_order: block.display_order,
          data: block.data,
        })),
      }

      if (isEditing && article) {
        await updateAdminArticle(article.id, articleData)
        toast.success("記事を更新しました")
      } else {
        await createAdminArticle(articleData)
        toast.success("記事を作成しました")
        router.push("/admin/articles")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error(isEditing ? "記事の更新に失敗しました" : "記事の作成に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={() => setShowPreview(false)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            編集に戻る
          </Button>
        </div>
        <ArticlePreview
          title={title}
          excerpt={excerpt}
          thumbnailImageUrl={thumbnailImageUrl}
          category={category}
          tags={tags}
          publishedAt={publishedAt}
          blocks={blocks.map((block) => ({
            type: block.type,
            display_order: block.display_order,
            data: block.data,
          }))}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEditing ? "記事を編集" : "新しい記事を作成"}</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowPreview(true)} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            プレビュー
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">タイトル *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="記事のタイトル" />
            </div>
            <div>
              <Label htmlFor="slug">スラッグ</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="article-slug" />
            </div>
          </div>

          <div>
            <Label htmlFor="excerpt">概要</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="記事の概要"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="thumbnail">サムネイル画像URL</Label>
            <Input
              id="thumbnail"
              value={thumbnailImageUrl}
              onChange={(e) => setThumbnailImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">カテゴリ</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">ニュース</SelectItem>
                  <SelectItem value="guide">ガイド</SelectItem>
                  <SelectItem value="deck">デッキ</SelectItem>
                  <SelectItem value="tournament">大会</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">優先度</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number.parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label>タグ</Label>
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="新しいタグ"
                onKeyPress={(e) => e.key === "Enter" && addTag()}
              />
              <Button onClick={addTag} size="sm">
                追加
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>公開設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="published" checked={isPublished} onCheckedChange={setIsPublished} />
            <Label htmlFor="published">公開する</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="pinned" checked={pinned} onCheckedChange={setPinned} />
            <Label htmlFor="pinned">ピン留めする</Label>
          </div>

          <div>
            <Label htmlFor="publishedAt">公開日時</Label>
            <Input
              id="publishedAt"
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Blocks */}
      <Card>
        <CardHeader>
          <CardTitle>コンテンツブロック</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocks.map((block, index) => (
            <div key={block.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-slate-400" />
                  <Badge variant="outline">{block.type}</Badge>
                  <span className="text-sm text-slate-500">#{index + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => moveBlock(block.id, "up")} size="sm" variant="ghost" disabled={index === 0}>
                    ↑
                  </Button>
                  <Button
                    onClick={() => moveBlock(block.id, "down")}
                    size="sm"
                    variant="ghost"
                    disabled={index === blocks.length - 1}
                  >
                    ↓
                  </Button>
                  <Button onClick={() => deleteBlock(block.id)} size="sm" variant="ghost" className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <BlockEditor type={block.type} data={block.data} onChange={(data) => updateBlock(block.id, data)} />
            </div>
          ))}

          <Separator />

          <div>
            <Label className="text-base font-medium mb-3 block">ブロックを追加</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => addBlock("heading")} variant="outline" size="sm">
                見出し
              </Button>
              <Button onClick={() => addBlock("paragraph")} variant="outline" size="sm">
                段落
              </Button>
              <Button onClick={() => addBlock("image")} variant="outline" size="sm">
                画像
              </Button>
              <Button onClick={() => addBlock("list")} variant="outline" size="sm">
                リスト
              </Button>
              <Button onClick={() => addBlock("table")} variant="outline" size="sm">
                テーブル
              </Button>
              <Button onClick={() => addBlock("flexible-table")} variant="outline" size="sm">
                柔軟テーブル
              </Button>
              <Button onClick={() => addBlock("callout")} variant="outline" size="sm">
                コールアウト
              </Button>
              <Button onClick={() => addBlock("cards-table")} variant="outline" size="sm">
                カードテーブル
              </Button>
              <Button onClick={() => addBlock("card-display-table")} variant="outline" size="sm">
                カード表示テーブル
              </Button>
              <Button onClick={() => addBlock("pickup")} variant="outline" size="sm">
                ピックアップ
              </Button>
              <Button onClick={() => addBlock("button")} variant="outline" size="sm">
                ボタン
              </Button>
              <Button onClick={() => addBlock("toc")} variant="outline" size="sm">
                目次
              </Button>
              <Button onClick={() => addBlock("related-links")} variant="outline" size="sm">
                関連リンク
              </Button>
              <Button onClick={() => addBlock("divider")} variant="outline" size="sm">
                区切り線
              </Button>
              <Button onClick={() => addBlock("evaluation")} variant="outline" size="sm">
                評価
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
