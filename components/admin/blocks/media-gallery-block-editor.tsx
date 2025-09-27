"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, ChevronDown, ChevronUp, Upload, X } from "lucide-react"
import Image from "next/image"

interface MediaItem {
  id: string
  url: string
  alt: string
  caption?: string
}

interface MediaGalleryData {
  items: MediaItem[]
  layout: "grid" | "carousel" | "masonry"
  columns: 2 | 3 | 4 | 5
}

interface MediaGalleryBlockEditorProps {
  data: MediaGalleryData
  onChange: (data: MediaGalleryData) => void
  onDelete: () => void
}

export function MediaGalleryBlockEditor({ data, onChange, onDelete }: MediaGalleryBlockEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const addMediaItem = () => {
    const newItem: MediaItem = {
      id: `media-${Date.now()}`,
      url: "",
      alt: "",
      caption: "",
    }

    onChange({
      ...data,
      items: [...data.items, newItem],
    })
  }

  const updateMediaItem = (itemId: string, updates: Partial<MediaItem>) => {
    onChange({
      ...data,
      items: data.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    })
  }

  const deleteMediaItem = (itemId: string) => {
    onChange({
      ...data,
      items: data.items.filter((item) => item.id !== itemId),
    })
  }

  const handleImageUpload = async (itemId: string, file: File) => {
    // 実際の実装では画像アップロード処理を行う
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const { url } = await response.json()
        updateMediaItem(itemId, { url })
      }
    } catch (error) {
      console.error("Image upload failed:", error)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">メディアギャラリー</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* レイアウト設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">レイアウト</Label>
              <Select value={data.layout} onValueChange={(value: any) => onChange({ ...data, layout: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">グリッド</SelectItem>
                  <SelectItem value="carousel">カルーセル</SelectItem>
                  <SelectItem value="masonry">マソンリー</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data.layout === "grid" && (
              <div>
                <Label className="text-sm font-medium">列数</Label>
                <Select
                  value={data.columns.toString()}
                  onValueChange={(value) => onChange({ ...data, columns: Number.parseInt(value) as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2列</SelectItem>
                    <SelectItem value="3">3列</SelectItem>
                    <SelectItem value="4">4列</SelectItem>
                    <SelectItem value="5">5列</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* メディアアイテム */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">メディアアイテム ({data.items.length})</Label>
              <Button variant="outline" size="sm" onClick={addMediaItem}>
                <Plus className="h-4 w-4 mr-1" />
                アイテムを追加
              </Button>
            </div>

            <div className="space-y-4">
              {data.items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">アイテム {index + 1}</span>
                    <Button variant="destructive" size="sm" onClick={() => deleteMediaItem(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 画像プレビュー・アップロード */}
                    <div>
                      <Label className="text-sm font-medium">画像</Label>
                      <div className="mt-1">
                        {item.url ? (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                            <Image
                              src={item.url || "/placeholder.svg"}
                              alt={item.alt || ""}
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => updateMediaItem(item.id, { url: "" })}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="aspect-video border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50">
                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500 mb-2">画像をアップロード</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleImageUpload(item.id, file)
                                }
                              }}
                              className="hidden"
                              id={`upload-${item.id}`}
                            />
                            <label
                              htmlFor={`upload-${item.id}`}
                              className="cursor-pointer bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              ファイルを選択
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* テキスト入力 */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`url-${item.id}`} className="text-sm font-medium">
                          画像URL（直接入力）
                        </Label>
                        <Input
                          id={`url-${item.id}`}
                          value={item.url}
                          onChange={(e) => updateMediaItem(item.id, { url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`alt-${item.id}`} className="text-sm font-medium">
                          代替テキスト
                        </Label>
                        <Input
                          id={`alt-${item.id}`}
                          value={item.alt}
                          onChange={(e) => updateMediaItem(item.id, { alt: e.target.value })}
                          placeholder="画像の説明"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`caption-${item.id}`} className="text-sm font-medium">
                          キャプション（任意）
                        </Label>
                        <Input
                          id={`caption-${item.id}`}
                          value={item.caption || ""}
                          onChange={(e) => updateMediaItem(item.id, { caption: e.target.value })}
                          placeholder="画像の説明文"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {data.items.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">メディアアイテムがありません</p>
                  <p className="text-xs text-slate-400 mt-1">「アイテムを追加」ボタンから追加してください</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
