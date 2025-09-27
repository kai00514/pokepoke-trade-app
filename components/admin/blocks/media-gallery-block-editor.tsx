"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, ImageIcon } from "lucide-react"
import { ImageUpload } from "../image-upload"

interface MediaItem {
  id: string
  url: string
  alt: string
  caption?: string
  type: "image" | "video"
}

interface MediaGalleryData {
  items: MediaItem[]
  layout: "grid" | "masonry" | "carousel" | "list"
  columns: number
}

interface MediaGalleryBlockEditorProps {
  data: MediaGalleryData
  onChange: (data: MediaGalleryData) => void
}

export function MediaGalleryBlockEditor({ data, onChange }: MediaGalleryBlockEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const safeData: MediaGalleryData = {
    items: data?.items || [],
    layout: data?.layout || "grid",
    columns: data?.columns || 3,
  }

  const handleAddItem = () => {
    const newItem: MediaItem = {
      id: `media-${Date.now()}`,
      url: "",
      alt: "",
      caption: "",
      type: "image",
    }
    onChange({ ...safeData, items: [...safeData.items, newItem] })
  }

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = safeData.items.filter((item) => item.id !== itemId)
    onChange({ ...safeData, items: updatedItems })
  }

  const handleItemChange = (itemId: string, field: keyof MediaItem, value: string) => {
    const updatedItems = safeData.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    onChange({ ...safeData, items: updatedItems })
  }

  const handleLayoutChange = (layout: string) => {
    onChange({ ...safeData, layout: layout as MediaGalleryData["layout"] })
  }

  const handleColumnsChange = (columns: string) => {
    onChange({ ...safeData, columns: Number.parseInt(columns) })
  }

  const handleImageUpload = (itemId: string, url: string) => {
    handleItemChange(itemId, "url", url)
    setUploadingIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">メディアギャラリー</Label>
        <Button onClick={handleAddItem} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          メディアを追加
        </Button>
      </div>

      {/* レイアウト設定 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">レイアウト設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>レイアウト</Label>
              <Select value={safeData.layout} onValueChange={handleLayoutChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">グリッド</SelectItem>
                  <SelectItem value="masonry">マソンリー</SelectItem>
                  <SelectItem value="carousel">カルーセル</SelectItem>
                  <SelectItem value="list">リスト</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>列数</Label>
              <Select value={safeData.columns.toString()} onValueChange={handleColumnsChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1列</SelectItem>
                  <SelectItem value="2">2列</SelectItem>
                  <SelectItem value="3">3列</SelectItem>
                  <SelectItem value="4">4列</SelectItem>
                  <SelectItem value="5">5列</SelectItem>
                  <SelectItem value="6">6列</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メディア項目 */}
      <div className="space-y-4">
        {safeData.items.map((item, index) => (
          <Card key={item.id} className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">メディア {index + 1}</CardTitle>
                <Button
                  onClick={() => handleDeleteItem(item.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 画像アップロード */}
                <div className="space-y-2">
                  <Label>画像</Label>
                  <div className="space-y-2">
                    <ImageUpload value={item.url} onChange={(url) => handleImageUpload(item.id, url)} />
                    {item.url && (
                      <div className="relative">
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt={item.alt || "プレビュー"}
                          className="w-full h-32 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* メタデータ */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>代替テキスト</Label>
                    <Input
                      value={item.alt}
                      onChange={(e) => handleItemChange(item.id, "alt", e.target.value)}
                      placeholder="画像の説明（アクセシビリティ用）"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>キャプション</Label>
                    <Input
                      value={item.caption || ""}
                      onChange={(e) => handleItemChange(item.id, "caption", e.target.value)}
                      placeholder="画像の説明文（任意）"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>タイプ</Label>
                    <Select value={item.type} onValueChange={(value) => handleItemChange(item.id, "type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">画像</SelectItem>
                        <SelectItem value="video">動画</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {safeData.items.length === 0 && (
          <Card className="border-2 border-dashed border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <ImageIcon className="h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500 text-center mb-4">メディアが追加されていません</p>
              <Button onClick={handleAddItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                最初のメディアを追加
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* プレビュー */}
      {safeData.items.length > 0 && (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm">プレビュー ({safeData.layout}レイアウト)</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`
                ${safeData.layout === "grid" ? `grid gap-4 grid-cols-${safeData.columns}` : ""}
                ${safeData.layout === "list" ? "space-y-4" : ""}
                ${safeData.layout === "carousel" ? "flex gap-4 overflow-x-auto" : ""}
                ${safeData.layout === "masonry" ? "columns-3 gap-4" : ""}
              `}
            >
              {safeData.items.map((item) => (
                <div
                  key={item.id}
                  className={`
                    ${safeData.layout === "list" ? "flex gap-4 items-start" : ""}
                    ${safeData.layout === "carousel" ? "flex-shrink-0 w-48" : ""}
                    ${safeData.layout === "masonry" ? "break-inside-avoid mb-4" : ""}
                  `}
                >
                  {item.url ? (
                    <img
                      src={item.url || "/placeholder.svg"}
                      alt={item.alt}
                      className={`
                        rounded border
                        ${safeData.layout === "list" ? "w-24 h-24 object-cover" : "w-full h-32 object-cover"}
                        ${safeData.layout === "carousel" ? "w-full h-32 object-cover" : ""}
                      `}
                    />
                  ) : (
                    <div
                      className={`
                        bg-slate-200 rounded border flex items-center justify-center
                        ${safeData.layout === "list" ? "w-24 h-24" : "w-full h-32"}
                      `}
                    >
                      <ImageIcon className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  {item.caption && (
                    <div className={safeData.layout === "list" ? "flex-1" : "mt-2"}>
                      <p className="text-sm text-slate-600">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
