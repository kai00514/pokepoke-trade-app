"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Minus, Plus, X } from "lucide-react"

interface CardDisplayProps {
  card: {
    id: number
    name: string
    image_url?: string
    game8_image_url?: string
    rarity?: string
    type?: string
  }
  quantity?: number
  onQuantityChange?: (cardId: number, quantity: number) => void
  onRemove?: (cardId: number) => void
  showControls?: boolean
  compact?: boolean
}

export function CardDisplay({
  card,
  quantity = 1,
  onQuantityChange,
  onRemove,
  showControls = false,
  compact = false,
}: CardDisplayProps) {
  const [imageError, setImageError] = useState(false)

  const imageUrl = card.game8_image_url || card.image_url || "/placeholder.svg"

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(0, Math.min(4, quantity + delta))
    onQuantityChange?.(card.id, newQuantity)
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2 p-2 border rounded-lg bg-white">
        <div className="relative w-12 h-16 flex-shrink-0">
          <Image
            src={imageError ? "/placeholder.svg" : imageUrl}
            alt={card.name}
            fill
            className="object-cover rounded"
            onError={() => setImageError(true)}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{card.name}</div>
          {card.type && (
            <Badge variant="outline" className="text-xs">
              {card.type}
            </Badge>
          )}
        </div>
        {showControls && (
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 0}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <Button variant="outline" size="sm" onClick={() => handleQuantityChange(1)} disabled={quantity >= 4}>
              <Plus className="h-3 w-3" />
            </Button>
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(card.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
        {!showControls && quantity > 1 && (
          <Badge variant="secondary" className="ml-2">
            ×{quantity}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="relative w-full h-48 mb-3">
          <Image
            src={imageError ? "/placeholder.svg" : imageUrl}
            alt={card.name}
            fill
            className="object-cover rounded"
            onError={() => setImageError(true)}
          />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-sm leading-tight">{card.name}</h3>
          <div className="flex items-center justify-between">
            {card.type && (
              <Badge variant="outline" className="text-xs">
                {card.type}
              </Badge>
            )}
            {card.rarity && (
              <Badge variant="secondary" className="text-xs">
                {card.rarity}
              </Badge>
            )}
          </div>
          {showControls && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 0}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button variant="outline" size="sm" onClick={() => handleQuantityChange(1)} disabled={quantity >= 4}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(card.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {!showControls && quantity > 1 && (
            <div className="text-center">
              <Badge variant="secondary">×{quantity}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
