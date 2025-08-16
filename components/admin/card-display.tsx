"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, X } from "lucide-react"

interface CardDisplayProps {
  card: {
    id: number
    name: string
    image_url?: string
    rarity?: string
    type?: string
  }
  quantity?: number
  showControls?: boolean
  onQuantityChange?: (cardId: number, quantity: number) => void
  onRemove?: (cardId: number) => void
}

export function CardDisplay({
  card,
  quantity = 1,
  showControls = false,
  onQuantityChange,
  onRemove,
}: CardDisplayProps) {
  const [currentQuantity, setCurrentQuantity] = useState(quantity)

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 0) return
    if (newQuantity > 4) return // ポケモンカードは最大4枚まで

    setCurrentQuantity(newQuantity)
    onQuantityChange?.(card.id, newQuantity)
  }

  return (
    <Card className="relative">
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {/* カード画像 */}
          <div className="w-16 h-20 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
            {card.image_url ? (
              <img src={card.image_url || "/placeholder.svg"} alt={card.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
            )}
          </div>

          {/* カード情報 */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{card.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
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

          {/* コントロール */}
          {showControls && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(currentQuantity - 1)}
                  disabled={currentQuantity <= 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={currentQuantity}
                  onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 0)}
                  className="w-12 h-8 text-center text-sm"
                  min="0"
                  max="4"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(currentQuantity + 1)}
                  disabled={currentQuantity >= 4}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove?.(card.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* 枚数表示（コントロールなしの場合） */}
          {!showControls && quantity > 1 && (
            <Badge variant="default" className="ml-2">
              ×{quantity}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
