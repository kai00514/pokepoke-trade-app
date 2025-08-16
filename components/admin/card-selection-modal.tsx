"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus } from "lucide-react"
import { CardDisplay } from "./card-display"

interface Card {
  id: number
  name: string
  image_url?: string
  game8_image_url?: string
  rarity?: string
  type?: string
}

interface SelectedCard {
  id: number
  name: string
  image_url?: string
  game8_image_url?: string
  rarity?: string
  type?: string
  quantity: number
}

interface CardSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedCards: SelectedCard[]) => void
  initialSelectedCards?: SelectedCard[]
}

// モックデータ（実際の実装では API から取得）
const mockCards: Card[] = [
  { id: 1, name: "ピカチュウ", type: "電気", rarity: "C" },
  { id: 2, name: "ライチュウ", type: "電気", rarity: "R" },
  { id: 3, name: "フシギダネ", type: "草", rarity: "C" },
  { id: 4, name: "フシギソウ", type: "草", rarity: "U" },
  { id: 5, name: "フシギバナ", type: "草", rarity: "R" },
  { id: 6, name: "ヒトカゲ", type: "炎", rarity: "C" },
  { id: 7, name: "リザード", type: "炎", rarity: "U" },
  { id: 8, name: "リザードン", type: "炎", rarity: "RR" },
  { id: 9, name: "ゼニガメ", type: "水", rarity: "C" },
  { id: 10, name: "カメール", type: "水", rarity: "U" },
]

export function CardSelectionModal({ isOpen, onClose, onConfirm, initialSelectedCards = [] }: CardSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>(initialSelectedCards)
  const [availableCards, setAvailableCards] = useState<Card[]>(mockCards)

  useEffect(() => {
    setSelectedCards(initialSelectedCards)
  }, [initialSelectedCards])

  const filteredCards = availableCards.filter((card) => card.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCardSelect = (card: Card) => {
    const existingCard = selectedCards.find((sc) => sc.id === card.id)
    if (existingCard) {
      if (existingCard.quantity < 4) {
        setSelectedCards((prev) => prev.map((sc) => (sc.id === card.id ? { ...sc, quantity: sc.quantity + 1 } : sc)))
      }
    } else {
      setSelectedCards((prev) => [...prev, { ...card, quantity: 1 }])
    }
  }

  const handleQuantityChange = (cardId: number, quantity: number) => {
    if (quantity <= 0) {
      setSelectedCards((prev) => prev.filter((sc) => sc.id !== cardId))
    } else {
      setSelectedCards((prev) => prev.map((sc) => (sc.id === cardId ? { ...sc, quantity } : sc)))
    }
  }

  const handleRemoveCard = (cardId: number) => {
    setSelectedCards((prev) => prev.filter((sc) => sc.id !== cardId))
  }

  const totalCards = selectedCards.reduce((sum, card) => sum + card.quantity, 0)

  const handleConfirm = () => {
    onConfirm(selectedCards)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            カード選択
            <Badge variant={totalCards > 60 ? "destructive" : "default"}>{totalCards}/60枚</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60vh]">
          {/* 利用可能なカード */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">利用可能なカード</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="カードを検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-full">
              <div className="space-y-2">
                {filteredCards.map((card) => {
                  const selectedCard = selectedCards.find((sc) => sc.id === card.id)
                  const isMaxQuantity = selectedCard && selectedCard.quantity >= 4

                  return (
                    <div key={card.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">
                          {card.id}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{card.name}</div>
                          <div className="text-xs text-gray-500">{card.type}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {card.rarity}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedCard && (
                          <Badge variant="secondary" className="text-xs">
                            ×{selectedCard.quantity}
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCardSelect(card)}
                          disabled={isMaxQuantity || totalCards >= 60}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* 選択されたカード */}
          <div className="space-y-4">
            <h3 className="font-medium">選択されたカード ({selectedCards.length}種類)</h3>
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {selectedCards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">カードが選択されていません</div>
                ) : (
                  selectedCards.map((card) => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      quantity={card.quantity}
                      showControls={true}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveCard}
                    />
                  ))
                )}
              </div>
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
