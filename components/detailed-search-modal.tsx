"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card as CardComponent, CardContent } from "@/components/ui/card"
import { Search, Plus, Minus, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface DetailedSearchModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCards: { [key: number]: number }
  onSelectionChange: (cards: { [key: number]: number }) => void
  onComplete?: () => void
  showCompleteButton?: boolean
}

export default function DetailedSearchModal({
  isOpen,
  onClose,
  selectedCards,
  onSelectionChange,
  onComplete,
  showCompleteButton = false,
}: DetailedSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [cards, setCards] = useState<
    { id: number; name: string; game8_image_url?: string; rarity?: string; type?: string }[]
  >([])
  const [loading, setLoading] = useState(false)
  const [localSelectedCards, setLocalSelectedCards] = useState<{ [key: number]: number }>({})

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedCards({ ...selectedCards })
      searchCards()
    }
  }, [isOpen, selectedCards])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm) {
        searchCards()
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const searchCards = async () => {
    setLoading(true)
    try {
      let query = supabase.from("cards").select("id, name, game8_image_url, rarity, type").order("name").limit(50)

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setCards(data || [])
    } catch (error) {
      console.error("Error searching cards:", error)
      toast({
        title: "カードの検索に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateCardQuantity = (cardId: number, change: number) => {
    setLocalSelectedCards((prev) => {
      const currentQuantity = prev[cardId] || 0
      const newQuantity = Math.max(0, currentQuantity + change)

      if (newQuantity === 0) {
        const { [cardId]: removed, ...rest } = prev
        return rest
      } else {
        return { ...prev, [cardId]: newQuantity }
      }
    })
  }

  const handleComplete = () => {
    onSelectionChange(localSelectedCards)
    if (onComplete) {
      onComplete()
    } else {
      onClose()
    }
  }

  const getCardImage = (card: {
    id: number
    name: string
    game8_image_url?: string
    rarity?: string
    type?: string
  }) => {
    if (card.game8_image_url) {
      return card.game8_image_url
    }
    return "/no-card.png"
  }

  const selectedCount = Object.values(localSelectedCards).reduce((sum, count) => sum + count, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>カード詳細検索</span>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && <Badge variant="secondary">{selectedCount}枚選択中</Badge>}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="カード名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">検索中...</div>
            ) : cards.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cards.map((card) => {
                  const quantity = localSelectedCards[card.id] || 0
                  return (
                    <CardComponent
                      key={card.id}
                      className={`overflow-hidden cursor-pointer transition-all ${quantity > 0 ? "ring-2 ring-blue-500" : ""}`}
                    >
                      <div className="aspect-[3/4] relative">
                        <img
                          src={getCardImage(card) || "/placeholder.svg"}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/no-card.png"
                          }}
                        />
                        {quantity > 0 && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-blue-600 text-white">{quantity}</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm truncate mb-2">{card.name}</h3>
                        <div className="flex items-center gap-1 mb-2">
                          {card.rarity && (
                            <Badge variant="outline" className="text-xs">
                              {card.rarity}
                            </Badge>
                          )}
                          {card.type && (
                            <Badge variant="outline" className="text-xs">
                              {card.type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCardQuantity(card.id, -1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">{quantity}</span>
                          <Button variant="outline" size="sm" onClick={() => updateCardQuantity(card.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </CardComponent>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "カードが見つかりませんでした" : "カード名を入力して検索してください"}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            {showCompleteButton && <Button onClick={handleComplete}>完了</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
