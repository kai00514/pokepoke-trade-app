"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus } from "lucide-react"
import { CardDisplay } from "./card-display"

interface Card {
  id: number
  name: string
  image_url?: string
  rarity?: string
  type?: string
  pack_name?: string
}

interface SelectedCard extends Card {
  quantity: number
}

interface CardSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedCards: SelectedCard[]) => void
  initialSelectedCards?: SelectedCard[]
}

export function CardSelectionModal({ isOpen, onClose, onConfirm, initialSelectedCards = [] }: CardSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [availableCards, setAvailableCards] = useState<Card[]>([])
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>(initialSelectedCards)
  const [loading, setLoading] = useState(false)

  // カード検索
  useEffect(() => {
    if (searchTerm.length < 2) {
      setAvailableCards([])
      return
    }

    const searchCards = async () => {
      setLoading(true)
      try {
        // ここで実際のカード検索APIを呼び出す
        // 今はモックデータを使用
        const mockCards: Card[] = [
          {
            id: 1,
            name: "ピカチュウ",
            image_url: "/placeholder.svg?height=100&width=80",
            rarity: "C",
            type: "電気",
            pack_name: "基本セット",
          },
          {
            id: 2,
            name: "リザードン",
            image_url: "/placeholder.svg?height=100&width=80",
            rarity: "RR",
            type: "炎",
            pack_name: "基本セット",
          },
          {
            id: 3,
            name: "フシギダネ",
            image_url: "/placeholder.svg?height=100&width=80",
            rarity: "C",
            type: "草",
            pack_name: "基本セット",
          },
        ]

        const filtered = mockCards.filter((card) => card.name.toLowerCase().includes(searchTerm.toLowerCase()))
        setAvailableCards(filtered)
      } catch (error) {
        console.error("カード検索エラー:", error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchCards, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const handleAddCard = (card: Card) => {
    const existingCard = selectedCards.find((c) => c.id === card.id)
    if (existingCard) {
      if (existingCard.quantity < 4) {
        setSelectedCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, quantity: c.quantity + 1 } : c)))
      }
    } else {
      setSelectedCards((prev) => [...prev, { ...card, quantity: 1 }])
    }
  }

  const handleQuantityChange = (cardId: number, quantity: number) => {
    if (quantity === 0) {
      setSelectedCards((prev) => prev.filter((c) => c.id !== cardId))
    } else {
      setSelectedCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, quantity } : c)))
    }
  }

  const handleRemoveCard = (cardId: number) => {
    setSelectedCards((prev) => prev.filter((c) => c.id !== cardId))
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
          <DialogTitle>カード選択</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[60vh]">
          {/* 左側: カード検索 */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="カード名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="space-y-2">
                {loading && <div className="text-center py-4 text-gray-500">検索中...</div>}

                {!loading && searchTerm.length >= 2 && availableCards.length === 0 && (
                  <div className="text-center py-4 text-gray-500">カードが見つかりません</div>
                )}

                {availableCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-16 bg-gray-100 rounded border overflow-hidden">
                        {card.image_url ? (
                          <img
                            src={card.image_url || "/placeholder.svg"}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{card.name}</div>
                        <div className="flex items-center space-x-1 mt-1">
                          {card.rarity && (
                            <Badge variant="outline" className="text-xs">
                              {card.rarity}
                            </Badge>
                          )}
                          {card.type && (
                            <Badge variant="secondary" className="text-xs">
                              {card.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAddCard(card)} disabled={totalCards >= 60}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 右側: 選択されたカード */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">選択されたカード</h3>
              <Badge variant={totalCards > 60 ? "destructive" : "default"}>{totalCards}/60枚</Badge>
            </div>

            <ScrollArea className="h-[calc(100%-60px)]">
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
          <Button onClick={handleConfirm} disabled={selectedCards.length === 0 || totalCards > 60}>
            確定 ({selectedCards.length}種類)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
