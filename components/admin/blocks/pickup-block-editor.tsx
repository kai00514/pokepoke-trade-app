"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface PickupItem {
  label: string
  href?: string
}

interface PickupBlockData {
  title?: string
  items: PickupItem[]
}

interface PickupBlockEditorProps {
  data: PickupBlockData
  onChange: (data: PickupBlockData) => void
}

export function PickupBlockEditor({ data, onChange }: PickupBlockEditorProps) {
  // データの初期化とデフォルト値の設定
  const safeData = {
    title: data?.title || "",
    items: Array.isArray(data?.items) ? data.items : [],
  }

  const handleChange = (field: keyof PickupBlockData, value: any) => {
    onChange({ ...safeData, [field]: value })
  }

  const handleItemChange = (index: number, field: keyof PickupItem, value: string) => {
    const newItems = [...safeData.items]
    if (newItems[index]) {
      newItems[index] = { ...newItems[index], [field]: value }
      handleChange("items", newItems)
    }
  }

  const addItem = () => {
    const newItem: PickupItem = { label: "", href: "" }
    handleChange("items", [...safeData.items, newItem])
  }

  const removeItem = (index: number) => {
    const newItems = safeData.items.filter((_, i) => i !== index)
    handleChange("items", newItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">ピックアップ</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pickup-title">タイトル</Label>
          <Input
            id="pickup-title"
            value={safeData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="ピックアップのタイトル"
          />
        </div>

        <div className="space-y-3">
          <Label>ピックアップ項目</Label>
          {safeData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 p-3 border rounded-lg">
              <div className="space-y-2">
                <Label className="text-xs">ラベル</Label>
                <Input
                  value={item.label || ""}
                  onChange={(e) => handleItemChange(index, "label", e.target.value)}
                  placeholder="項目のラベル"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">URL（オプション）</Label>
                <div className="flex space-x-2">
                  <Input
                    value={item.href || ""}
                    onChange={(e) => handleItemChange(index, "href", e.target.value)}
                    placeholder="https://example.com"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addItem} className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            項目を追加
          </Button>
        </div>
      </div>

      {/* プレビュー */}
      {(safeData.title || safeData.items.length > 0) && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">★</span>
              </div>
              <div className="flex-1">
                {safeData.title && <h4 className="font-semibold text-red-800 mb-2">{safeData.title}</h4>}
                {safeData.items.length > 0 && (
                  <ul className="space-y-1">
                    {safeData.items.map((item, index) => (
                      <li key={index} className="text-red-700">
                        {item.href ? (
                          <a href={item.href} className="hover:underline" target="_blank" rel="noopener noreferrer">
                            {item.label || "ラベル未設定"}
                          </a>
                        ) : (
                          item.label || "ラベル未設定"
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
