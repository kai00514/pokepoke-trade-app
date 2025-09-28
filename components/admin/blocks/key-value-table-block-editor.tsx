"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Search } from "lucide-react"
import { DetailedSearchModal } from "@/components/detailed-search-modal"

interface KeyValueRow {
  id: string
  key: string
  valueType: "text" | "card"
  textValue?: string
  cardValue?: {
    card_id: number
    name: string
    image_url?: string
  }
}

interface KeyValueTableData {
  title?: string
  rows: KeyValueRow[]
}

interface KeyValueTableBlockEditorProps {
  data: KeyValueTableData
  onChange: (data: KeyValueTableData) => void
}

export function KeyValueTableBlockEditor({ data, onChange }: KeyValueTableBlockEditorProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

  const addRow = () => {
    const newRow: KeyValueRow = {
      id: Date.now().toString(),
      key: "",
      valueType: "text",
      textValue: "",
    }

    onChange({
      ...data,
      rows: [...(data.rows || []), newRow],
    })
  }

  const removeRow = (rowId: string) => {
    onChange({
      ...data,
      rows: (data.rows || []).filter((row) => row.id !== rowId),
    })
  }

  const updateRow = (rowId: string, updates: Partial<KeyValueRow>) => {
    onChange({
      ...data,
      rows: (data.rows || []).map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
    })
  }

  const handleCardSelect = (card: any) => {
    if (editingRowId) {
      updateRow(editingRowId, {
        cardValue: {
          card_id: card.id,
          name: card.name,
          image_url: card.game8_image_url || card.image_url,
        },
      })
      setEditingRowId(null)
    }
    setSearchModalOpen(false)
  }

  const openCardSearch = (rowId: string) => {
    setEditingRowId(rowId)
    setSearchModalOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">キー・バリューテーブル</CardTitle>
        <div className="space-y-2">
          <Input
            placeholder="テーブルタイトル（オプション）"
            value={data.title || ""}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(data.rows || []).map((row, index) => (
          <div key={row.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">行 {index + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRow(row.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* キー（ヘッダー）列 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">キー（ヘッダー）</label>
                <Input
                  placeholder="例: 開催期間"
                  value={row.key}
                  onChange={(e) => updateRow(row.id, { key: e.target.value })}
                />
              </div>

              {/* 値列 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">値のタイプ</label>
                <Select
                  value={row.valueType}
                  onValueChange={(value: "text" | "card") => {
                    updateRow(row.id, {
                      valueType: value,
                      textValue: value === "text" ? row.textValue : undefined,
                      cardValue: value === "card" ? row.cardValue : undefined,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">テキスト</SelectItem>
                    <SelectItem value="card">カード</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 値の入力エリア */}
            <div>
              {row.valueType === "text" ? (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">テキスト内容</label>
                  <Textarea
                    placeholder="値を入力してください"
                    value={row.textValue || ""}
                    onChange={(e) => updateRow(row.id, { textValue: e.target.value })}
                    rows={3}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">カード選択</label>
                  <div className="space-y-2">
                    <Button variant="outline" onClick={() => openCardSearch(row.id)} className="w-full">
                      <Search className="h-4 w-4 mr-2" />
                      カードを選択
                    </Button>
                    {row.cardValue && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {row.cardValue.image_url && (
                          <img
                            src={row.cardValue.image_url || "/placeholder.svg"}
                            alt={row.cardValue.name}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{row.cardValue.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            ID: {row.cardValue.card_id}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateRow(row.id, { cardValue: undefined })}
                          className="ml-auto text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <Button onClick={addRow} variant="outline" className="w-full bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          行を追加
        </Button>

        {/* プレビュー */}
        {(data.rows || []).length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-3">プレビュー</h4>
            {data.title && <h3 className="font-bold text-lg mb-3">{data.title}</h3>}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="border border-gray-300 bg-blue-50 px-4 py-3 font-medium text-sm">
                        {row.key || "（未入力）"}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        {row.valueType === "text" ? (
                          <div className="text-sm whitespace-pre-wrap">{row.textValue || "（未入力）"}</div>
                        ) : row.cardValue ? (
                          <div className="flex items-center space-x-3">
                            {row.cardValue.image_url && (
                              <img
                                src={row.cardValue.image_url || "/placeholder.svg"}
                                alt={row.cardValue.name}
                                className="w-16 h-20 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium text-sm">{row.cardValue.name}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">（カード未選択）</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>

      <DetailedSearchModal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false)
          setEditingRowId(null)
        }}
        onCardSelect={handleCardSelect}
      />
    </Card>
  )
}
