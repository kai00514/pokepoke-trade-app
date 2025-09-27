"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit, Search } from "lucide-react"
import { DetailedSearchModal } from "@/components/detailed-search-modal"

interface CardDisplayRow {
  id: string
  header: string
  cards: Array<{
    id: number
    name: string
    image_url?: string
    game8_image_url?: string
  }>
}

interface CardDisplayTableBlockData {
  rows: CardDisplayRow[]
}

interface CardDisplayTableBlockEditorProps {
  data: CardDisplayTableBlockData
  onChange: (data: CardDisplayTableBlockData) => void
}

export function CardDisplayTableBlockEditor({ data, onChange }: CardDisplayTableBlockEditorProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

  const addRow = () => {
    const newRow: CardDisplayRow = {
      id: `row-${Date.now()}`,
      header: "新しいヘッダー",
      cards: [],
    }
    onChange({
      ...data,
      rows: [...data.rows, newRow],
    })
  }

  const updateRowHeader = (rowId: string, header: string) => {
    onChange({
      ...data,
      rows: data.rows.map((row) => (row.id === rowId ? { ...row, header } : row)),
    })
  }

  const deleteRow = (rowId: string) => {
    onChange({
      ...data,
      rows: data.rows.filter((row) => row.id !== rowId),
    })
  }

  const openCardSearch = (rowId: string) => {
    setEditingRowId(rowId)
    setSearchModalOpen(true)
  }

  const handleCardSelection = (selectedCards: any[]) => {
    if (!editingRowId) return

    const formattedCards = selectedCards.map((card) => ({
      id: card.id,
      name: card.name,
      image_url: card.image_url,
      game8_image_url: card.game8_image_url,
    }))

    onChange({
      ...data,
      rows: data.rows.map((row) => (row.id === editingRowId ? { ...row, cards: formattedCards } : row)),
    })

    setSearchModalOpen(false)
    setEditingRowId(null)
  }

  const removeCardFromRow = (rowId: string, cardId: number) => {
    onChange({
      ...data,
      rows: data.rows.map((row) =>
        row.id === rowId ? { ...row, cards: row.cards.filter((card) => card.id !== cardId) } : row,
      ),
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">カード表示テーブル</CardTitle>
          <Button onClick={addRow} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            行を追加
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.rows.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>行が追加されていません</p>
            <Button onClick={addRow} variant="outline" className="mt-2 bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              最初の行を追加
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.rows.map((row, index) => (
              <Card key={row.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <Label className="text-sm font-medium">ヘッダー {index + 1}:</Label>
                      <Input
                        value={row.header}
                        onChange={(e) => updateRowHeader(row.id, e.target.value)}
                        placeholder="ヘッダーテキストを入力"
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => openCardSearch(row.id)} size="sm" variant="outline">
                        <Search className="h-4 w-4 mr-2" />
                        カード選択
                      </Button>
                      <Button onClick={() => deleteRow(row.id)} size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {row.cards.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                      <p>カードが選択されていません</p>
                      <Button onClick={() => openCardSearch(row.id)} variant="outline" size="sm" className="mt-2">
                        <Search className="h-4 w-4 mr-2" />
                        カードを選択
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {row.cards.map((card) => (
                        <div key={card.id} className="relative group">
                          <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border">
                            {card.game8_image_url || card.image_url ? (
                              <img
                                src={card.game8_image_url || card.image_url}
                                alt={card.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/no-card.png"
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                                画像なし
                              </div>
                            )}
                            <Button
                              onClick={() => removeCardFromRow(row.id, card.id)}
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-center mt-1 truncate" title={card.name}>
                            {card.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {row.cards.length > 0 && (
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="secondary">{row.cards.length} 枚のカード</Badge>
                      <Button onClick={() => openCardSearch(row.id)} size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        編集
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* プレビュー */}
        {data.rows.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.rows.map((row) => (
                  <div key={row.id}>
                    <h3 className="text-lg font-semibold mb-3 text-blue-600">{row.header}</h3>
                    {row.cards.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {row.cards.map((card) => (
                          <div key={card.id} className="text-center">
                            <div className="aspect-[3/4] bg-slate-100 rounded overflow-hidden border">
                              {card.game8_image_url || card.image_url ? (
                                <img
                                  src={card.game8_image_url || card.image_url}
                                  alt={card.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "/no-card.png"
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                                  画像なし
                                </div>
                              )}
                            </div>
                            <p className="text-xs mt-1 truncate" title={card.name}>
                              {card.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">カードが選択されていません</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* カード検索モーダル */}
        <DetailedSearchModal
          isOpen={searchModalOpen}
          onClose={() => {
            setSearchModalOpen(false)
            setEditingRowId(null)
          }}
          onSelectionComplete={handleCardSelection}
          initialSelectedCards={editingRowId ? data.rows.find((row) => row.id === editingRowId)?.cards || [] : []}
          multiSelect={true}
        />
      </CardContent>
    </Card>
  )
}
