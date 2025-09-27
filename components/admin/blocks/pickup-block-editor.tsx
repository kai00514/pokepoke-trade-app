"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface PickupItem {
  title: string
  url: string
}

interface PickupBlockData {
  title: string
  items: PickupItem[]
}

interface PickupBlockEditorProps {
  data: PickupBlockData
  onChange: (data: PickupBlockData) => void
}

export function PickupBlockEditor({ data, onChange }: PickupBlockEditorProps) {
  const handleChange = (field: keyof PickupBlockData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const handleItemChange = (index: number, field: keyof PickupItem, value: string) => {
    const newItems = [...data.items]
    newItems[index] = { ...newItems[index], [field]: value }
    handleChange("items", newItems)
  }

  const addItem = () => {
    const newItem: PickupItem = { title: "", url: "" }
    handleChange("items", [...data.items, newItem])
  }

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index)
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
            value={data.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="ピックアップのタイトル"
          />
        </div>

        <div className="space-y-3">
          <Label>ピックアップ項目</Label>
          {data.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 p-3 border rounded-lg">
              <div className="space-y-2">
                <Label className="text-xs">タイトル</Label>
                <Input
                  value={item.title}
                  onChange={(e) => handleItemChange(index, "title", e.target.value)}
                  placeholder="項目のタイトル"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">URL</Label>
                <div className="flex space-x-2">
                  <Input
                    value={item.url}
                    onChange={(e) => handleItemChange(index, "url", e.target.value)}
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
      {(data.title || data.items.length > 0) && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
          <div className="bg-white rounded-lg border p-4">
            {data.title && <h3 className="text-lg font-semibold mb-3">{data.title}</h3>}
            {data.items.length > 0 && (
              <div className="space-y-2">
                {data.items.map((item, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-medium text-blue-900">{item.title || "タイトル未設定"}</h4>
                    {item.url && (
                      <a href={item.url} className="text-sm text-blue-600 hover:underline">
                        {item.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
