"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, GripVertical } from "lucide-react"

interface TocItem {
  text: string
  href: string
}

interface TocBlockData {
  title?: string
  items: TocItem[]
}

interface TocBlockEditorProps {
  data: TocBlockData
  onChange: (data: TocBlockData) => void
  onDelete: () => void
}

export function TocBlockEditor({ data, onChange, onDelete }: TocBlockEditorProps) {
  const [title, setTitle] = useState(data.title || "目次")
  const [items, setItems] = useState<TocItem[]>(data.items || [])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    onChange({ ...data, title: newTitle, items })
  }

  const handleItemChange = (index: number, field: keyof TocItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
    onChange({ ...data, title, items: newItems })
  }

  const addItem = () => {
    const newItems = [...items, { text: "", href: "" }]
    setItems(newItems)
    onChange({ ...data, title, items: newItems })
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    onChange({ ...data, title, items: newItems })
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
          目次ブロック
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="toc-title">タイトル</Label>
          <Input id="toc-title" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="目次" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>目次項目</Label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              項目を追加
            </Button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50">
              <div className="flex-1 space-y-2">
                <Input
                  value={item.text}
                  onChange={(e) => handleItemChange(index, "text", e.target.value)}
                  placeholder="見出しテキスト"
                  className="text-sm"
                />
                <Input
                  value={item.href}
                  onChange={(e) => handleItemChange(index, "href", e.target.value)}
                  placeholder="#section-id"
                  className="text-sm font-mono"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="text-red-600 hover:text-red-700 mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm">目次項目がありません</p>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2 bg-transparent">
                <Plus className="h-4 w-4 mr-1" />
                最初の項目を追加
              </Button>
            </div>
          )}
        </div>

        {/* プレビュー */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg">
          <h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2">プレビュー</h4>
          <div className="bg-white/10 backdrop-blur-sm rounded-md p-3">
            <h5 className="font-bold text-white mb-2 text-sm">{title}</h5>
            <ul className="space-y-1">
              {items.map((item, index) => (
                <li key={index} className="text-white text-xs flex items-center gap-2">
                  <div className="w-1 h-1 bg-white rounded-full flex-shrink-0"></div>
                  {item.text || "（未入力）"}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
