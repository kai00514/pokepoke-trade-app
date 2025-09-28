"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Search, Type, ImageIcon, X } from "lucide-react"
import Image from "next/image"
import DetailedSearchModal from "@/components/detailed-search-modal"

interface KeyValueRow {
  id: string
  key: string
  valueType: "text" | "card"
  textValue?: string
  cardValues?: {
    id: string
    name: string
    imageUrl: string
  }[]
}

interface KeyValueTableBlockData {
  rows: KeyValueRow[]
}

interface KeyValueTableBlockEditorProps {
  data: KeyValueTableBlockData
  onChange: (data: KeyValueTableBlockData) => void
}

export function KeyValueTableBlockEditor({ data, onChange }: KeyValueTableBlockEditorProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

  const safeData: KeyValueTableBlockData = {
    rows: data?.rows || [],
  }

  const addRow = () => {
    const newRow: KeyValueRow = {
      id: `row-${Date.now()}`,
      key: "新しいキー",
      valueType: "text",
      textValue: "",
    }
    onChange({
      rows: [...safeData.rows, newRow],
    })
  }

  const updateRow = (rowId: string, updates: Partial<KeyValueRow>) => {
    onChange({
      rows: safeData.rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row)),
    })
  }

  const deleteRow = (rowId: string) => {
    onChange({
      rows: safeData.rows.filter((row) => row.id !== rowId),
    })
  }

  const openCardSearch = (rowId: string) => {
    setEditingRowId(rowId)
    setSearchModalOpen(true)
  }

  const handleCardSelectionComplete = (selectedCards: any[]) => {
    if (!editingRowId) return

    const cardValues = selectedCards.map((card) => ({
      id: card.id.toString(),
      name: card.name,
      imageUrl: card.game8_image_url || card.image_url || "/placeholder.svg",
    }))

    updateRow(editingRowId, { cardValues })
    setSearchModalOpen(false)
    setEditingRowId(null)
  }

  const removeCard = (rowId: string, cardId: string) => {
    const row = safeData.rows.find((r) => r.id === rowId)
    if (row && row.cardValues) {
      const updatedCards = row.cardValues.filter((card) => card.id !== cardId)
      updateRow(rowId, { cardValues: updatedCards })
    }
  }

  const getCurrentRowCards = () => {
    if (!editingRowId) return []
    const row = safeData.rows.find((r) => r.id === editingRowId)
    return row?.cardValues || []
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">キー・バリューテーブル</CardTitle>
          <Button onClick={addRow} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            行を追加
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {safeData.rows.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>行が追加されていません</p>
            <Button onClick={addRow} variant="outline" className="mt-2 bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              最初の行を追加
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {safeData.rows.map((row, index) => (
              <Card key={row.id} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <Label className="text-sm font-medium">行 {index + 1}:</Label>
                      <Input
                        value={row.key}
                        onChange={(e) => updateRow(row.id, { key: e.target.value })}
                        placeholder="キー（ヘッダー）を入力"
                        className="flex-1 max-w-xs"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={row.valueType}
                        onValueChange={(value: "text" | "card") => {
                          updateRow(row.id, {
                            valueType: value,
                            textValue: value === "text" ? row.textValue || "" : undefined,
                            cardValues: value === "card" ? row.cardValues || [] : undefined,
                          })
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">
                            <div className="flex items-center gap-2">
                              <Type className="h-4 w-4" />
                              テキスト
                            </div>
                          </SelectItem>
                          <SelectItem value="card">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" />
                              カード
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => deleteRow(row.id)} size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {row.valueType === "text" ? (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">テキスト内容:</Label>
                      <Textarea
                        value={row.textValue || ""}
                        onChange={(e) => updateRow(row.id, { textValue: e.target.value })}
                        placeholder="内容を入力してください"
                        rows={3}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">カード:</Label>
                      <div className="space-y-3">
                        <Button onClick={() => openCardSearch(row.id)} variant="outline" size="sm">
                          <Search className="h-4 w-4 mr-2" />
                          カードを選択
                        </Button>

                        {row.cardValues && row.cardValues.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {row.cardValues.map((card) => (
                              <div key={card.id} className="relative p-3 bg-slate-50 rounded-lg border">
                                <Button
                                  onClick={() => removeCard(row.id, card.id)}
                                  size="sm"
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <div className="flex flex-col items-center space-y-2">
                                  <Image
                                    src={card.imageUrl || "/placeholder.svg"}
                                    alt={card.name}
                                    width={80}
                                    height={112}
                                    className="rounded border border-slate-200 object-cover"
                                  />
                                  <div className="text-center">
                                    <p className="font-medium text-sm text-slate-900 line-clamp-2">{card.name}</p>
                                    <p className="text-xs text-slate-500">ID: {card.id}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                            <p>カードが選択されていません</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* プレビュー */}
        {safeData.rows.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <tbody>
                    {safeData.rows.map((row, rowIndex) => (
                      <tr key={row.id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-b border-slate-200 bg-slate-100 align-top whitespace-nowrap w-32">
                          {row.key}
                        </td>
                        <td className="px-4 py-3 border-b border-slate-200 w-full">
                          {row.valueType === "text" ? (
                            <div className="text-sm text-slate-600 whitespace-pre-wrap">
                              {row.textValue || "（内容なし）"}
                            </div>
                          ) : row.cardValues && row.cardValues.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                              {row.cardValues.map((card) => (
                                <div key={card.id} className="flex flex-col items-center space-y-1">
                                  <Image
                                    src={card.imageUrl || "/placeholder.svg"}
                                    alt={card.name}
                                    width={60}
                                    height={84}
                                    className="rounded border border-slate-200 object-cover"
                                  />
                                  <p className="text-xs font-medium text-slate-900 text-center line-clamp-2 max-w-[60px]">
                                    {card.name}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">（カード未選択）</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* カード検索モーダル */}
        <DetailedSearchModal
          isOpen={searchModalOpen}
          onOpenChange={setSearchModalOpen}
          onSelectionComplete={handleCardSelectionComplete}
          initialSelectedCards={getCurrentRowCards()}
          modalTitle="カードを選択"
        />
      </CardContent>
    </Card>
  )
}
