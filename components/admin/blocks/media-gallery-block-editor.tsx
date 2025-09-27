"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Upload, ExternalLink } from "lucide-react"
import Image from "next/image"
import { ImageUpload } from "../image-upload"

interface MediaItem {
  id: string
  type: "image" | "video" | "embed"
  url: string
  caption?: string
  alt?: string
}

interface MediaGalleryData {
  items: MediaItem[]
  layout: "grid" | "carousel" | "masonry"
  columns: 2 | 3 | 4 | 5
}

interface MediaGalleryBlockEditorProps {
  data: MediaGalleryData
  onChange: (data: MediaGalleryData) => void
}

export function MediaGalleryBlockEditor({ data, onChange }: MediaGalleryBlockEditorProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  const addImageItem = () => {
    setEditingItemId("new")
    setIsUploadModalOpen(true)
  }

  const addUrlItem = () => {
    const newItem: MediaItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "image",
      url: "",
      caption: "",
      alt: "",
    }
    onChange({
      ...data,
      items: [...data.items, newItem],
    })
  }

  const updateItem = (itemId: string, updates: Partial<MediaItem>) => {
    onChange({
      ...data,
      items: data.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    })
  }

  const deleteItem = (itemId: string) => {
    onChange({
      ...data,
      items: data.items.filter((item) => item.id !== itemId),
    })
  }

  const handleImageUpload = (url: string) => {
    if (editingItemId === "new") {
      const newItem: MediaItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "image",
        url,
        caption: "",
        alt: "",
      }
      onChange({
        ...data,
        items: [...data.items, newItem],
      })
    } else if (editingItemId) {
      updateItem(editingItemId, { url })
    }
    setIsUploadModalOpen(false)
    setEditingItemId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">メディアギャラリー</Label>
        <div className="flex items-center gap-2">
          <Select value={data.layout} onValueChange={(value: any) => onChange({ ...data, layout: value })}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">グリッド</SelectItem>
              <SelectItem value="carousel">カルーセル</SelectItem>
              <SelectItem value="masonry">マソンリー</SelectItem>
            </SelectContent>
          </Select>
          {data.layout === "grid" && (
            <Select
              value={data.columns.toString()}
              onValueChange={(value) => onChange({ ...data, columns: Number.parseInt(value) as any })}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2列</SelectItem>
                <SelectItem value="3">3列</SelectItem>
                <SelectItem value="4">4列</SelectItem>
                <SelectItem value="5">5列</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={addImageItem} size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            画像追加
          </Button>
          <Button onClick={addUrlItem} size="sm" variant="outline">
            <ExternalLink className="h-4 w-4 mr-1" />
            URL追加
          </Button>
        </div>
      </div>

      {data.items.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <p>メディアが追加されていません</p>
          <p className="text-sm">「画像追加」または「URL追加」ボタンからメディアを追加してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((item) => (
            <Card key={item.id} className="border border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* プレビュー */}
                  <div className="flex-shrink-0 w-24 h-24 bg-slate-100 rounded-lg overflow-hidden">
                    {item.url ? (
                      <Image
                        src={item.url || "/placeholder.svg"}
                        alt={item.alt || ""}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Upload className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* 設定 */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs text-slate-600">URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={item.url}
                          onChange={(e) => updateItem(item.id, { url: e.target.value })}
                          placeholder="画像URL"
                          className="text-sm"
                        />
                        <Button
                          onClick={() => {
                            setEditingItemId(item.id)
                            setIsUploadModalOpen(true)
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-slate-600">キャプション</Label>
                      <Input
                        value={item.caption || ""}
                        onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                        placeholder="キャプション"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-600">代替テキスト</Label>
                      <Input
                        value={item.alt || ""}
                        onChange={(e) => updateItem(item.id, { alt: e.target.value })}
                        placeholder="代替テキスト"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* 削除ボタン */}
                  <Button
                    onClick={() => deleteItem(item.id)}
                    size="sm"
                    variant="ghost"
                    className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 画像アップロードモーダル */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">画像をアップロード</h3>
            <ImageUpload value="" onChange={handleImageUpload} />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setEditingItemId(null)
                }}
                variant="outline"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
