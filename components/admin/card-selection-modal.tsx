"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import CardDisplay from "@/components/card-display"

interface CardData {
  id: number
  name: string
  pack_name: string
  image_url?: string
  thumb_url?: string
}

interface SelectedCard {
  card_id: number
  pack_name: string
  card_count: number
  display_order: number
}

interface CardSelectionModalProps {
  selectedCards: SelectedCard[]
  onChange: (cards: SelectedCard[]) => void
  trigger?: React.ReactNode
}

export function CardSelectionModal({ selectedCards, onChange, trigger }: CardSelectionModalProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<CardData[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const searchCards = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("id, name, pack_name, image_url, thumb_url")
        .ilike("name", `%${term}%`)
        .limit(50)

      if (error) {
        console.error("Card search error:", error)
        return
      }

      setSearchResults(data || [])
    } catch (error) {
      console.error("Card search error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCards(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const addCard = (card: CardData) => {
    const existingCard = selectedCards.find((c) => c.card_id === card.id)

    if (existingCard) {
      // 既存のカードの枚数を増やす
      const updatedCards = selectedCards.map((c) =>
        c.card_id === card.id ? { ...c, card_count: c.card_count + 1 } : c,
      )
      onChange(updatedCards)
    } else {
      // 新しいカードを追加
      const newCard: SelectedCard = {
        card_id: card.id,
        pack_name: card.pack_name,
        card_count: 1,
        display_order: selectedCards.length,
      }
      onChange([...selectedCards, newCard])
    }
  }

  const removeCard = (cardId: number) => {
    const updatedCards = selectedCards
      .filter((c) => c.card_id !== cardId)
      .map((c, index) => ({ ...c, display_order: index }))
    onChange(updatedCards)
  }

  const updateCardCount = (cardId: number, count: number) => {
    if (count <= 0) {
      removeCard(cardId)
      return
    }

    const updatedCards = selectedCards.map((c) => (c.card_id === cardId ? { ...c, card_count: count } : c))
    onChange(updatedCards)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            カードを選択
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>カード選択</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-6">
          {/* 左側: カード検索 */}
          <div className="flex-1 flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="カード名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">検索中...</div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">
                    {searchTerm ? "カードが見つかりません" : "カード名を入力して検索してください"}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {searchResults.map((card) => (
                    <Card
                      key={card.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => addCard(card)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-16 flex-shrink-0">
                            <CardDisplay cardId={card.id} useThumb />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{card.name}</div>
                            <div className="text-xs text-gray-500 truncate">{card.pack_name}</div>
                          </div>
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右側: 選択されたカード */}
          <div className="w-80 flex flex-col">
            <h4 className="font-medium mb-4">選択されたカード ({selectedCards.length}枚)</h4>
            <div className="flex-1 overflow-y-auto">
              {selectedCards.length === 0 ? (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center text-gray-500 text-sm">
                    左側からカードを
                    <br />
                    選択してください
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCards.map((card) => (
                    <Card key={card.card_id}>
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-14 flex-shrink-0">
                            <CardDisplay cardId={card.card_id} useThumb />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs">ID: {card.card_id}</div>
                            <div className="text-xs text-gray-500 truncate">{card.pack_name}</div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 bg-transparent"
                              onClick={() => updateCardCount(card.card_id, card.card_count - 1)}
                            >
                              -
                            </Button>
                            <span className="w-6 text-center text-xs font-medium">{card.card_count}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 bg-transparent"
                              onClick={() => updateCardCount(card.card_id, card.card_count + 1)}
                            >
                              +
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => removeCard(card.card_id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => setOpen(false)}>完了</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
