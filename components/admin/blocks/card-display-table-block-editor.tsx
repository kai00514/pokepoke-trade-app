"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus, Search } from "lucide-react"
import Image from "next/image"
import DetailedSearchModal, { type Card as SearchCard } from "@/components/detailed-search-modal"

interface CardDisplayTableData {
  rows: Array<{
    id: string
    header: string
    cards: SearchCard[]
  }>
}

interface CardDisplayTableBlockEditorProps {
  data: CardDisplayTableData
  onChange: (data: CardDisplayTableData) => void
}

export function CardDisplayTableBlockEditor({ data, onChange }: CardDisplayTableBlockEditorProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

  const addRow = () => {
    const newRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      header: "",
      cards: [],
    }
    onChange({
      rows: [...data.rows, newRow],
    })
  }

  const updateRowHeader = (rowId: string, header: string) => {
    onChange({
      rows: data.rows.map((row) => (row.id === rowId ? { ...row, header } : row)),
    })
  }

  const deleteRow = (rowId: string) => {
    onChange({
      rows: data.rows.filter((row) => row.id !== rowId),
    })
  }

  const openCardSearch = (rowId: string) => {
    setEditingRowId(rowId)
    setIsSearchModalOpen(true)
  }

  const handleCardSelection = (selectedCards: SearchCard[]) => {
    if (editingRowId) {
      onChange({
        rows: data.rows.map((row) => (row.id === editingRowId ? { ...row, cards: selectedCards } : row)),
      })
    }
    setIsSearchModalOpen(false)
    setEditingRowId(null)
  }

  const removeCard = (rowId: string, cardId: string) => {
    onChange({
      rows: data.rows.map((row) =>
        row.id === rowId ? { ...row, cards: row.cards.filter((card) => card.id !== cardId) } : row,
      ),
    })
  }

  const getCurrentRowCards = () => {
    if (!editingRowId) return []
    const row = data.rows.find((r) => r.id === editingRowId)
    return row?.cards || []
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">カード表示テーブル</Label>
        <Button onClick={addRow} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          行を追加
        </Button>
      </div>

      {data.rows.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <p>行が追加されていません</p>
          <p className="text-sm">「行を追加」ボタンから行を追加してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.rows.map((row, index) => (
            <Card key={row.id} className="border border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* 行番号 */}
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                    {index + 1}
                  </div>

                  {/* ヘッダー入力 */}
                  <div className="flex-shrink-0 w-32">
                    <Label className="text-xs text-slate-600 mb-1 block">ヘッダー</Label>
                    <Input
                      value={row.header}
                      onChange={(e) => updateRowHeader(row.id, e.target.value)}
                      placeholder="ヘッダー名"
                      className="text-sm"
                    />
                  </div>

                  {/* カード表示エリア */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-slate-600">カード ({row.cards.length}枚)</Label>
                      <Button
                        onClick={() => openCardSearch(row.id)}
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        カード選択
                      </Button>
                    </div>

                    {row.cards.length > 0 ? (
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {row.cards.map((card) => (
                          <div key={card.id} className="relative group">
                            <div className="aspect-[5/7] relative rounded border overflow-hidden bg-slate-100">
                              <Image
                                src={card.imageUrl || "/placeholder.svg"}
                                alt={card.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 16vw, (max-width: 768px) 12vw, 10vw"
                              />
                            </div>
                            <button
                              onClick={() => removeCard(row.id, card.id)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="削除"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <div className="mt-1 text-[10px] text-slate-600 truncate" title={card.name}>
                              {card.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-500 text-sm">
                        カードが選択されていません
                      </div>
                    )}
                  </div>

                  {/* 削除ボタン */}
                  <Button
                    onClick={() => deleteRow(row.id)}
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

      <DetailedSearchModal
        isOpen={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        onSelectionComplete={handleCardSelection}
        initialSelectedCards={getCurrentRowCards()}
        modalTitle="カードを選択"
      />
    </div>
  )
}
