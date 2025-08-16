"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus } from "lucide-react"
import { CardDisplay } from "./card-display"
import { createClient } from "@/lib/supabase/client"

interface Card {
  id: number
  name: string
  image_url?: string
  game8_image_url?: string
  rarity?: string
  type?: string
}

interface SelectedCard {
  card_id: number
  quantity: number
  card?: Card
}

interface CardSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedCards: SelectedCard[]) => void
  initialSelectedCards?: SelectedCard[]
}

export function CardSelectionModal({ isOpen, onClose, onConfirm, initialSelectedCards = [] }: CardSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [cards, setCards] = useState<Card[]>([])
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>(initialSelectedCards)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCards()
    }
  }, [isOpen])

  const fetchCards = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("cards")
        .select("id, name, image_url, game8_image_url, rarity, type")
        .order("name")
        .limit(100)

      if (error) {
        console.error("Error fetching cards:", error)
        return
      }

      setCards(data || [])
    } catch (error) {
      console.error("Error fetching cards:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchCards = async (term: string) => {
    if (!term.trim()) {
      fetchCards()
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("cards")
        .select("id, name, image_url, game8_image_url, rarity, type")
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(50)

      if (error) {
        console.error("Error searching cards:", error)
        return
      }

      setCards(data || [])
    } catch (error) {
      console.error("Error searching cards:", error)
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

  const handleCardSelect = (card: Card) => {
    const existingCard = selectedCards.find((sc) => sc.card_id === card.id)
    if (existingCard) {
      if (existingCard.quantity < 4) {
        setSelectedCards((prev) =>
          prev.map((sc) => (sc.card_id === card.id ? { ...sc, quantity: sc.quantity + 1 } : sc)),
        )
      }
    } else {
      setSelectedCards((prev) => [...prev, { card_id: card.id, quantity: 1, card }])
    }
  }

  const handleQuantityChange = (cardId: number, quantity: number) => {
    if (quantity === 0) {
      setSelectedCards((prev) => prev.filter((sc) => sc.card_id !== cardId))
    } else {
      setSelectedCards((prev) => prev.map((sc) => (sc.card_id === cardId ? { ...sc, quantity } : sc)))
    }
  }

  const handleRemoveCard = (cardId: number) => {
    setSelectedCards((prev) => prev.filter((sc) => sc.card_id !== cardId))
  }

  const totalCards = selectedCards.reduce((sum, sc) => sum + sc.quantity, 0)

  const handleConfirm = () => {
    onConfirm(selectedCards)
    onClose()
  }

  const getSelectedQuantity = (cardId: number) => {
    return selectedCards.find((sc) => sc.card_id === cardId)?.quantity || 0
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>カード選択</DialogTitle>
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="カード名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant={totalCards > 60 ? "destructive" : "secondary"}>{totalCards}/60枚</Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* カード検索結果 */}
          <div className="lg:col-span-2">
            <h3 className="font-medium mb-3">カード一覧</h3>
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="text-center py-8">読み込み中...</div>
              ) : cards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">カードが見つかりません</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {cards.map((card) => {
                    const selectedQuantity = getSelectedQuantity(card.id)
                    return (
                      <div key={card.id} className="relative">
                        <div
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => handleCardSelect(card)}
                        >
                          <CardDisplay card={card} compact />
                        </div>
                        {selectedQuantity > 0 && (
                          <Badge variant="default" className="absolute -top-2 -right-2 bg-blue-600">
                            {selectedQuantity}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute bottom-2 right-2 h-6 w-6 p-0"
                          onClick={() => handleCardSelect(card)}
                          disabled={selectedQuantity >= 4}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* 選択されたカード */}
          <div>
            <h3 className="font-medium mb-3">選択されたカード</h3>
            <ScrollArea className="h-[400px]">
              {selectedCards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">カードを選択してください</div>
              ) : (
                <div className="space-y-2">
                  {selectedCards.map((selectedCard) => (
                    <CardDisplay
                      key={selectedCard.card_id}
                      card={selectedCard.card!}
                      quantity={selectedCard.quantity}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveCard}
                      showControls
                      compact
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm} disabled={selectedCards.length === 0}>
            確定 ({totalCards}枚)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
