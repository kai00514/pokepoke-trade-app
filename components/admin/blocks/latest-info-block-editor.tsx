"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, GripVertical } from "lucide-react"

interface LatestInfoItem {
  label: string
  href?: string
}

interface LatestInfoBlockData {
  title?: string
  items: LatestInfoItem[]
}

interface LatestInfoBlockEditorProps {
  data: LatestInfoBlockData
  onChange: (data: LatestInfoBlockData) => void
}

export function LatestInfoBlockEditor({ data, onChange }: LatestInfoBlockEditorProps) {
  const [title, setTitle] = useState(data.title || "最新情報")
  const [items, setItems] = useState<LatestInfoItem[]>(data.items || [])

  const updateData = (newTitle: string, newItems: LatestInfoItem[]) => {
    setTitle(newTitle)
    setItems(newItems)
    onChange({ title: newTitle, items: newItems })
  }

  const addItem = () => {
    const newItems = [...items, { label: "", href: "" }]
    updateData(title, newItems)
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    updateData(title, newItems)
  }

  const updateItem = (index: number, field: keyof LatestInfoItem, value: string) => {
    const newItems = items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value }
      }
      return item
    })
    updateData(title, newItems)
  }

  const updateTitle = (newTitle: string) => {
    updateData(newTitle, items)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">最新情報ブロック設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            タイトル
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => updateTitle(e.target.value)}
            placeholder="最新情報"
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">情報項目</Label>
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-4 border rounded-lg bg-slate-50">
              <div className="flex-shrink-0 mt-2">
                <GripVertical className="h-4 w-4 text-slate-400" />
              </div>

              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`item-label-${index}`} className="text-sm font-medium">
                    項目名 *
                  </Label>
                  <Input
                    id={`item-label-${index}`}
                    value={item.label}
                    onChange={(e) => updateItem(index, "label", e.target.value)}
                    placeholder="情報項目名を入力"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-href-${index}`} className="text-sm font-medium">
                    リンク先（任意）
                  </Label>
                  <Input
                    id={`item-href-${index}`}
                    value={item.href || ""}
                    onChange={(e) => updateItem(index, "href", e.target.value)}
                    placeholder="https://example.com または /path/to/page"
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            onClick={addItem}
            variant="outline"
            className="w-full border-dashed border-2 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
          >
            <Plus className="h-4 w-4 mr-2" />
            情報項目を追加
          </Button>

          {items.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">情報項目がありません</p>
              <p className="text-xs mt-1">「情報項目を追加」ボタンをクリックして項目を追加してください</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
