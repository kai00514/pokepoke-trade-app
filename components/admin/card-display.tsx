"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, Trash2 } from "lucide-react"

interface CardData {
  id: number
  name: string
  image_url?: string
  game8_image_url?: string
  rarity?: string
  type?: string
  quantity?: number
}

interface CardDisplayProps {
  card: CardData
  quantity?: number
  showControls?: boolean
  useThumb?: boolean
  className?: string
  onQuantityChange?: (cardId: number, quantity: number) => void
  onRemove?: (cardId: number) => void
}

export function CardDisplay({
  card,
  quantity = 1,
  showControls = false,
  useThumb = false,
  className = "",
  onQuantityChange,
  onRemove,
}: CardDisplayProps) {
  const [currentQuantity, setCurrentQuantity] = useState(quantity)

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 0) return
    setCurrentQuantity(newQuantity)
    onQuantityChange?.(card.id, newQuantity)
  }

  const imageUrl = card.game8_image_url || card.image_url || "/placeholder.svg"

  return (
    <Card className={`${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {/* カード画像 */}
          <div className={`flex-shrink-0 ${useThumb ? "w-12 h-16" : "w-16 h-20"}`}>
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={card.name}
              className="w-full h-full object-cover rounded border"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
            />
          </div>

          {/* カード情報 */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{card.name}</div>
            <div className="text-xs text-gray-500">ID: {card.id}</div>
            {card.type && <div className="text-xs text-gray-500">タイプ: {card.type}</div>}
            {card.rarity && (
              <Badge variant="outline" className="text-xs">
                {card.rarity}
              </Badge>
            )}
          </div>

          {/* 数量コントロール */}
          {showControls && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(currentQuantity - 1)}
                  disabled={currentQuantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={currentQuantity}
                  onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                  min="1"
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
              <Button variant="ghost" size="sm" onClick={() => onRemove?.(card.id)} className="text-red-500">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* 数量表示のみ */}
          {!showControls && quantity > 1 && (
            <Badge variant="secondary" className="text-xs">
              ×{quantity}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
