"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Search, ChevronDown, ChevronUp } from "lucide-react"
import { DetailedSearchModal } from "@/components/detailed-search-modal"
import Image from "next/image"

interface CardData {
  id: string
  name: string
  imageUrl: string
  type?: string
  rarity?: string
  category?: string
  pack_id?: number
}

interface TableRow {
  id: string
  header: string
  cards: CardData[]
}

interface CardDisplayTableData {
  rows: TableRow[]
}

interface CardDisplayTableBlockEditorProps {
  data: CardDisplayTableData
  onChange: (data: CardDisplayTableData) => void
  onDelete: () => void
}

export function CardDisplayTableBlockEditor({ data, onChange, onDelete }: CardDisplayTableBlockEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [currentRowId, setCurrentRowId] = useState<string | null>(null)

  const addRow = () => {
    const newRow: TableRow = {
      id: `row-${Date.now()}`,
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
    setCurrentRowId(rowId)
    setSearchModalOpen(true)
  }

  const handleCardSelect = (selectedCards: any[]) => {
    if (!currentRowId) return

    const formattedCards: CardData[] = selectedCards.map((card) => ({
      id: card.id.toString(),
      name: card.name,
      imageUrl: card.game8_image_url || card.image_url || "/placeholder.svg",
      type: card.type,
      rarity: card.rarity,
      category: card.category,
      pack_id: card.pack_id,
    }))

    onChange({
      rows: data.rows.map((row) =>
        row.id === currentRowId ? { ...row, cards: [...row.cards, ...formattedCards] } : row,
      ),
    })

    setSearchModalOpen(false)
    setCurrentRowId(null)
  }

  const removeCard = (rowId: string, cardId: string) => {
    onChange({
      rows: data.rows.map((row) =>
        row.id === rowId ? { ...row, cards: row.cards.filter((card) => card.id !== cardId) } : row,
      ),
    })
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">カード表示テーブル</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {data.rows.map((row) => (
                <div key={row.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`header-${row.id}`} className="text-sm font-medium">
                        ヘッダー
                      </Label>
                      <Input
                        id={`header-${row.id}`}
                        value={row.header}
                        onChange={(e) => updateRowHeader(row.id, e.target.value)}
                        placeholder="例: 報酬、必要カード、おすすめカードなど"
                        className="mt-1"
                      />
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => deleteRow(row.id)} className="mt-6">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">カード ({row.cards.length}枚)</Label>
                      <Button variant="outline" size="sm" onClick={() => openCardSearch(row.id)}>
                        <Search className="h-4 w-4 mr-1" />
                        カードを追加
                      </Button>
                    </div>

                    {row.cards.length > 0 ? (
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg">
                        {row.cards.map((card) => (
                          <div key={card.id} className="relative group">
                            <div className="aspect-[5/7] relative rounded border overflow-hidden bg-white">
                              <Image
                                src={card.imageUrl || "/placeholder.svg"}
                                alt={card.name}
                                fill
                                className="object-cover"
                                sizes="60px"
                              />
                              <button
                                onClick={() => removeCard(row.id, card.id)}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                            <div className="mt-1 text-[8px] text-slate-600 text-center truncate">{card.name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed">
                        <Search className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm">カードが選択されていません</p>
                        <p className="text-xs text-slate-400 mt-1">「カードを追加」ボタンから選択してください</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={addRow} variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              行を追加
            </Button>
          </CardContent>
        )}
      </Card>

      <DetailedSearchModal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false)
          setCurrentRowId(null)
        }}
        onSelect={handleCardSelect}
        multiSelect={true}
      />
    </>
  )
}
