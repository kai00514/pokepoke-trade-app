"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface CardItem {
  id: string
  card_id: number
  quantity: number | string
  explanation: string
}

interface CardsTableBlockData {
  items: CardItem[]
  headers: {
    id: string
    card: string
    quantity: string
    explanation: string
  }
}

interface CardsTableBlockEditorProps {
  data: CardsTableBlockData
  onChange: (data: CardsTableBlockData) => void
}

export function CardsTableBlockEditor({ data, onChange }: CardsTableBlockEditorProps) {
  const handleChange = (field: keyof CardsTableBlockData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  const handleHeaderChange = (field: keyof CardsTableBlockData["headers"], value: string) => {
    const newHeaders = { ...data.headers, [field]: value }
    handleChange("headers", newHeaders)
  }

  const handleItemChange = (index: number, field: keyof CardItem, value: any) => {
    const newItems = [...data.items]
    newItems[index] = { ...newItems[index], [field]: value }
    handleChange("items", newItems)
  }

  const addItem = () => {
    const newItem: CardItem = {
      id: `${data.items.length + 1}`,
      card_id: 0,
      quantity: 1,
      explanation: "",
    }
    handleChange("items", [...data.items, newItem])
  }

  const removeItem = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index)
    handleChange("items", newItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">カードテーブル</span>
      </div>

      <div className="space-y-4">
        {/* ヘッダー設定 */}
        <div className="space-y-2">
          <Label>テーブルヘッダー</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input
              placeholder="ID列名"
              value={data.headers.id}
              onChange={(e) => handleHeaderChange("id", e.target.value)}
            />
            <Input
              placeholder="カード列名"
              value={data.headers.card}
              onChange={(e) => handleHeaderChange("card", e.target.value)}
            />
            <Input
              placeholder="数量列名"
              value={data.headers.quantity}
              onChange={(e) => handleHeaderChange("quantity", e.target.value)}
            />
            <Input
              placeholder="説明列名"
              value={data.headers.explanation}
              onChange={(e) => handleHeaderChange("explanation", e.target.value)}
            />
          </div>
        </div>

        {/* カード項目 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>カード項目</Label>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              カード追加
            </Button>
          </div>

          {data.items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">カード #{index + 1}</span>
                <Button variant="outline" size="sm" onClick={() => removeItem(index)} disabled={data.items.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ID</Label>
                  <Input
                    placeholder="①"
                    value={item.id}
                    onChange={(e) => handleItemChange(index, "id", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>カードID *</Label>
                  <Input
                    type="number"
                    placeholder="1533"
                    value={item.card_id}
                    onChange={(e) => handleItemChange(index, "card_id", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>数量</Label>
                  <Input
                    placeholder="1 または text"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = e.target.value
                      // 数値に変換できる場合は数値、そうでなければ文字列として保存
                      const numValue = Number.parseInt(value)
                      handleItemChange(index, "quantity", isNaN(numValue) ? value : numValue)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>説明</Label>
                  <Input
                    placeholder="役割や使用方法"
                    value={item.explanation}
                    onChange={(e) => handleItemChange(index, "explanation", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* プレビュー */}
      {data.items.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">{data.headers.id}</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">{data.headers.card}</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">{data.headers.quantity}</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">{data.headers.explanation}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-4 py-2">{item.id}</td>
                    <td className="border border-gray-300 px-4 py-2">カードID: {item.card_id}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
