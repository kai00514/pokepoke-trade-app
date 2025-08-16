"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface CardSearchProps {
  selectedCards: SelectedCard[]
  onChange: (cards: SelectedCard[]) => void
}

export function CardSearch({ selectedCards, onChange }: CardSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<CardData[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const supabase = createClient()

  const searchCards = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("id, name, pack_name, image_url, thumb_url")
        .ilike("name", `%${term}%`)
        .limit(20)

      if (error) {
        console.error("Card search error:", error)
        return
      }

      setSearchResults(data || [])
      setShowResults(true)
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

    setSearchTerm("")
    setShowResults(false)
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
    <div className="space-y-4">
      {/* カード検索 */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="カード名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 検索結果 */}
        {showResults && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">検索中...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500">カードが見つかりません</div>
            ) : (
              searchResults.map((card) => (
                <div
                  key={card.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => addCard(card)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-16 flex-shrink-0">
                      <CardDisplay cardId={card.id} useThumb />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{card.name}</div>
                      <div className="text-xs text-gray-500">{card.pack_name}</div>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 選択されたカード一覧 */}
      <div className="space-y-2">
        <h4 className="font-medium">選択されたカード ({selectedCards.length}枚)</h4>
        {selectedCards.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            カードを検索して追加してください
          </div>
        ) : (
          <div className="grid gap-2">
            {selectedCards.map((card) => (
              <Card key={card.card_id}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-16 flex-shrink-0">
                      <CardDisplay cardId={card.card_id} useThumb />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">カードID: {card.card_id}</div>
                      <div className="text-xs text-gray-500">{card.pack_name}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCardCount(card.card_id, card.card_count - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium">{card.card_count}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCardCount(card.card_id, card.card_count + 1)}
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCard(card.card_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
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
  )
}
