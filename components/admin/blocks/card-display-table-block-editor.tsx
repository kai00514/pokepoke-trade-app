"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Search } from "lucide-react"
import { DetailedSearchModal } from "@/components/detailed-search-modal"

interface CardDisplayRow {
  id: string
  header: string
  cards: Array<{
    id: string
    card_id: number
    card_name?: string
    image_url?: string
  }>
}

interface CardDisplayTableData {
  rows: CardDisplayRow[]
}

interface CardDisplayTableBlockEditorProps {
  data: CardDisplayTableData
  onChange: (data: CardDisplayTableData) => void
}

export function CardDisplayTableBlockEditor({ data, onChange }: CardDisplayTableBlockEditorProps) {
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [currentRowId, setCurrentRowId] = useState<string>("")

  const safeData: CardDisplayTableData = {
    rows: data?.rows || [
      {
        id: `row-${Date.now()}`,
        header: "ヘッダー1",
        cards: [],
      },
    ],
  }

  const handleRowHeaderChange = (rowId: string, header: string) => {
    const updatedRows = safeData.rows.map((row) => (row.id === rowId ? { ...row, header } : row))
    onChange({ ...safeData, rows: updatedRows })
  }

  const handleAddRow = () => {
    const newRow: CardDisplayRow = {
      id: `row-${Date.now()}`,
      header: `ヘッダー${safeData.rows.length + 1}`,
      cards: [],
    }
    onChange({ ...safeData, rows: [...safeData.rows, newRow] })
  }

  const handleDeleteRow = (rowId: string) => {
    const updatedRows = safeData.rows.filter((row) => row.id !== rowId)
    onChange({ ...safeData, rows: updatedRows })
  }

  const handleOpenCardSearch = (rowId: string) => {
    setCurrentRowId(rowId)
    setSearchModalOpen(true)
  }

  const handleCardSelect = (cards: any[]) => {
    if (!currentRowId) return

    const selectedCards = cards.map((card, index) => ({
      id: `card-${Date.now()}-${index}`,
      card_id: card.id,
      card_name: card.name,
      image_url: card.game8_image_url || card.image_url,
    }))

    const updatedRows = safeData.rows.map((row) =>
      row.id === currentRowId ? { ...row, cards: [...row.cards, ...selectedCards] } : row,
    )

    onChange({ ...safeData, rows: updatedRows })
    setSearchModalOpen(false)
    setCurrentRowId("")
  }

  const handleRemoveCard = (rowId: string, cardId: string) => {
    const updatedRows = safeData.rows.map((row) =>
      row.id === rowId ? { ...row, cards: row.cards.filter((card) => card.id !== cardId) } : row,
    )
    onChange({ ...safeData, rows: updatedRows })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">カード表示テーブル</Label>
        <Button onClick={handleAddRow} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          行を追加
        </Button>
      </div>

      <div className="space-y-4">
        {safeData.rows.map((row, rowIndex) => (
          <Card key={row.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">行 {rowIndex + 1}</CardTitle>
                <Button
                  onClick={() => handleDeleteRow(row.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ヘッダー入力 */}
              <div className="space-y-2">
                <Label htmlFor={`header-${row.id}`}>ヘッダー</Label>
                <Input
                  id={`header-${row.id}`}
                  value={row.header}
                  onChange={(e) => handleRowHeaderChange(row.id, e.target.value)}
                  placeholder="ヘッダーテキストを入力"
                />
              </div>

              {/* カード選択 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>カード ({row.cards.length}枚)</Label>
                  <Button onClick={() => handleOpenCardSearch(row.id)} size="sm" variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    カードを選択
                  </Button>
                </div>

                {/* 選択されたカード一覧 */}
                {row.cards.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {row.cards.map((card) => (
                      <div key={card.id} className="relative group border rounded-lg p-2 bg-slate-50">
                        {card.image_url ? (
                          <img
                            src={card.image_url || "/placeholder.svg"}
                            alt={card.card_name || "カード"}
                            className="w-full h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-20 bg-slate-200 rounded flex items-center justify-center">
                            <span className="text-xs text-slate-500">画像なし</span>
                          </div>
                        )}
                        <p className="text-xs mt-1 truncate">{card.card_name || `カードID: ${card.card_id}`}</p>
                        <Button
                          onClick={() => handleRemoveCard(row.id, card.id)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white hover:bg-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {row.cards.length === 0 && (
                  <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                    <p className="text-sm">カードが選択されていません</p>
                    <p className="text-xs">「カードを選択」ボタンから追加してください</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* プレビュー */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-sm">プレビュー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {safeData.rows.map((row) => (
              <div key={row.id} className="space-y-2">
                <h3 className="font-medium text-sm bg-blue-100 px-3 py-2 rounded">{row.header}</h3>
                {row.cards.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {row.cards.map((card) => (
                      <div key={card.id} className="text-center">
                        {card.image_url ? (
                          <img
                            src={card.image_url || "/placeholder.svg"}
                            alt={card.card_name || "カード"}
                            className="w-full h-16 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-full h-16 bg-slate-200 rounded border flex items-center justify-center">
                            <span className="text-xs text-slate-500">画像なし</span>
                          </div>
                        )}
                        <p className="text-xs mt-1 truncate">{card.card_name || `ID: ${card.card_id}`}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">カードが選択されていません</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* カード検索モーダル */}
      <DetailedSearchModal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false)
          setCurrentRowId("")
        }}
        onSelect={handleCardSelect}
        multiSelect={true}
      />
    </div>
  )
}
