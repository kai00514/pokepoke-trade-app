"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Star } from "lucide-react"

interface LatestInfoBlockData {
  title?: string
  items: { label: string; href?: string }[]
}

interface LatestInfoBlockEditorProps {
  data: LatestInfoBlockData
  onChange: (data: LatestInfoBlockData) => void
}

export function LatestInfoBlockEditor({ data, onChange }: LatestInfoBlockEditorProps) {
  const handleTitleChange = (title: string) => {
    onChange({
      ...data,
      title,
    })
  }

  const handleItemChange = (index: number, field: "label" | "href", value: string) => {
    const newItems = [...data.items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    onChange({
      ...data,
      items: newItems,
    })
  }

  const addItem = () => {
    onChange({
      ...data,
      items: [...data.items, { label: "", href: "" }],
    })
  }

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index)
    onChange({
      ...data,
      items: newItems,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-red-600" />
          最新情報ブロック
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            value={data.title || ""}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="最新情報"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>情報項目</Label>
            <Button onClick={addItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              項目を追加
            </Button>
          </div>

          {data.items.map((item, index) => (
            <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">項目 {index + 1}</span>
                <Button
                  onClick={() => removeItem(index)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`label-${index}`}>ラベル *</Label>
                  <Input
                    id={`label-${index}`}
                    value={item.label}
                    onChange={(e) => handleItemChange(index, "label", e.target.value)}
                    placeholder="情報のタイトル"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`href-${index}`}>リンク（任意）</Label>
                  <Input
                    id={`href-${index}`}
                    value={item.href || ""}
                    onChange={(e) => handleItemChange(index, "href", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          ))}

          {data.items.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Star className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">情報項目がありません</p>
              <p className="text-xs text-slate-400 mt-1">「項目を追加」ボタンから追加してください</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">プレビュー</h4>
          <div className="border-2 border-red-400 rounded-lg bg-red-50 shadow-sm">
            <div className="bg-red-500 text-white px-4 py-2 rounded-t-lg">
              <h3 className="font-bold text-base">{data.title || "最新情報"}</h3>
            </div>
            <div className="p-4 bg-white rounded-b-lg">
              {data.items.length > 0 ? (
                <ul className="space-y-2">
                  {data.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {itemIndex + 1}
                      </span>
                      <span className="text-blue-600 font-medium text-sm leading-relaxed">
                        {item.label || "（未設定）"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">情報項目が設定されていません</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
