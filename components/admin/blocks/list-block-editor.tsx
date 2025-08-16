"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

interface ListBlockEditorProps {
  data: {
    items: string[]
    style: "bulleted" | "numbered"
  }
  onChange: (data: any) => void
}

export function ListBlockEditor({ data, onChange }: ListBlockEditorProps) {
  const updateData = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...data.items]
    newItems[index] = value
    updateData("items", newItems)
  }

  const addItem = () => {
    updateData("items", [...data.items, ""])
  }

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index)
    updateData("items", newItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">リスト</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="list-style">リストスタイル</Label>
          <Select value={data.style} onValueChange={(value) => updateData("style", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bulleted">箇条書き</SelectItem>
              <SelectItem value="numbered">番号付き</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>リスト項目</Label>
          {data.items.map((item, index) => (
            <div key={index} className="flex space-x-2">
              <Input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder={`項目 ${index + 1}`}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                disabled={data.items.length <= 1}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" onClick={addItem} className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            項目を追加
          </Button>
        </div>
      </div>

      {/* プレビュー */}
      {data.items.some((item) => item.trim()) && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
          <div className="bg-white rounded-lg border p-4">
            {data.style === "bulleted" ? (
              <ul className="list-disc list-inside space-y-1">
                {data.items
                  .filter((item) => item.trim())
                  .map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
              </ul>
            ) : (
              <ol className="list-decimal list-inside space-y-1">
                {data.items
                  .filter((item) => item.trim())
                  .map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
