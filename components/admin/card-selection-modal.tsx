"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { CardDisplay } from "./card-display"

interface CardSelectionModalProps {
  selectedCards: Array<{
    card_id: number
    card_count: number
    pack_name?: string
  }>
  onChange: (
    cards: Array<{
      card_id: number
      card_count: number
      pack_name?: string
    }>,
  ) => void
}

interface CardData {
  id: number
  name: string
  pack_name: string
  rarity: string
  type: string
  game8_image_url?: string
  thumb_image_url?: string
}

export function CardSelectionModal({ selectedCards, onChange }: CardSelectionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [cards, setCards] = useState<CardData[]>([])
  const [loading, setLoading] = useState(false)
  const [tempSelectedCards, setTempSelectedCards] = useState(selectedCards)

  useEffect(() => {
    setTempSelectedCards(selectedCards)
  }, [selectedCards])

  const searchCards = async (term: string) => {
    if (!term.trim()) {
      setCards([])
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("cards")
        .select("id, name, pack_name, rarity, type, game8_image_url, thumb_image_url")
        .ilike("name", `%${term}%`)
        .limit(20)

      if (error) {
        console.error("Error searching cards:", error)
      } else {
        setCards(data || [])
      }
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchCards(searchTerm)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getCardCount = (cardId: number) => {
    const card = tempSelectedCards.find((c) => c.card_id === cardId)
    return card ? card.card_count : 0
  }

  const updateCardCount = (cardId: number, count: number, packName: string) => {
    if (count <= 0) {
      setTempSelectedCards((prev) => prev.filter((c) => c.card_id !== cardId))
    } else {
      setTempSelectedCards((prev) => {
        const existing = prev.find((c) => c.card_id === cardId)
        if (existing) {
          return prev.map((c) => (c.card_id === cardId ? { ...c, card_count: count } : c))
        } else {
          return [...prev, { card_id: cardId, card_count: count, pack_name: packName }]
        }
      })
    }
  }

  const handleSave = () => {
    onChange(tempSelectedCards)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempSelectedCards(selectedCards)
    setIsOpen(false)
  }

  const totalCards = tempSelectedCards.reduce((sum, card) => sum + card.card_count, 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          カードを選択 ({selectedCards.length}種類, {selectedCards.reduce((sum, card) => sum + card.card_count, 0)}枚)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>カード選択</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {/* 検索バー */}
          <div className="space-y-2">
            <Label htmlFor="card-search">カード名で検索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="card-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="カード名を入力..."
                className="pl-10"
              />
            </div>
          </div>

          {/* 選択済みカード情報 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium">
              選択中: {tempSelectedCards.length}種類, {totalCards}枚
            </span>
            <Badge variant={totalCards > 60 ? "destructive" : "default"}>{totalCards}/60枚</Badge>
          </div>

          {/* カード検索結果 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">検索中...</div>
              </div>
            ) : cards.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">
                  {searchTerm ? "カードが見つかりませんでした" : "カード名を入力して検索してください"}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cards.map((card) => {
                  const count = getCardCount(card.id)
                  return (
                    <Card key={card.id} className={count > 0 ? "ring-2 ring-blue-500" : ""}>
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-20 flex-shrink-0">
                            <CardDisplay cardId={card.id} useThumb className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{card.name}</div>
                            <div className="text-xs text-gray-500">{card.pack_name}</div>
                            <div className="text-xs text-gray-500">
                              {card.rarity} • {card.type}
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCardCount(card.id, Math.max(0, count - 1), card.pack_name)}
                                disabled={count === 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{count}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCardCount(card.id, count + 1, card.pack_name)}
                                disabled={count >= 4}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* 選択済みカード一覧 */}
          {tempSelectedCards.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">選択済みカード</Label>
              <div className="mt-2 max-h-32 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {tempSelectedCards.map((card) => (
                    <div key={card.card_id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <div className="w-8 h-10 flex-shrink-0">
                        <CardDisplay cardId={card.card_id} useThumb className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">ID: {card.card_id}</div>
                        <div className="text-xs text-gray-500">×{card.card_count}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCardCount(card.card_id, 0, card.pack_name || "")}
                        className="text-red-500 p-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>選択を確定 ({totalCards}枚)</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
