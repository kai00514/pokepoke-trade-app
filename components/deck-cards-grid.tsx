"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface DeckCard {
  id: number
  name: string
  quantity: number
  category: string
  image_url?: string
  thumb_url?: string
  game8_image_url?: string
}

interface DeckCardsGridProps {
  deckName: string
  energyType: string
  energyImage?: string
  cards: DeckCard[]
}

export function DeckCardsGrid({ deckName, energyType, energyImage, cards }: DeckCardsGridProps) {
  // カードをカテゴリ別にグループ化
  const groupedCards = cards.reduce(
    (acc, card) => {
      if (!acc[card.category]) {
        acc[card.category] = []
      }
      acc[card.category].push(card)
      return acc
    },
    {} as Record<string, DeckCard[]>,
  )

  // カテゴリの順序を定義
  const categoryOrder = ["ポケモン", "トレーナーズ", "エネルギー"]

  const getCardImageUrl = (card: DeckCard) => {
    if (card.game8_image_url) return card.game8_image_url
    if (card.image_url) return card.image_url
    if (card.thumb_url) return card.thumb_url
    return "/placeholder.svg?height=350&width=250"
  }

  return (
    <div className="space-y-6">
      {/* デッキ情報ヘッダー */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {energyImage && (
            <Image
              src={energyImage || "/placeholder.svg"}
              alt={energyType}
              width={32}
              height={32}
              className="rounded"
            />
          )}
          <span className="font-medium text-gray-700">{energyType}タイプ</span>
        </div>
        <div className="text-sm text-gray-600">総枚数: {cards.reduce((sum, card) => sum + card.quantity, 0)}枚</div>
      </div>

      {/* カテゴリ別カード表示 */}
      {categoryOrder.map((category) => {
        const categoryCards = groupedCards[category]
        if (!categoryCards || categoryCards.length === 0) return null

        const totalQuantity = categoryCards.reduce((sum, card) => sum + card.quantity, 0)

        return (
          <div key={category} className="space-y-3">
            <h4 className="font-semibold text-lg text-gray-800 border-l-4 border-blue-500 pl-3">
              {category} ({totalQuantity}枚)
            </h4>

            {/* 横スクロール可能なカードコンテナ */}
            <div className="overflow-x-auto">
              <div className="flex gap-4 pb-2" style={{ minWidth: "max-content" }}>
                {categoryCards.map((card) => (
                  <Card key={card.id} className="flex-shrink-0 w-48 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="relative">
                        <Image
                          src={getCardImageUrl(card) || "/placeholder.svg"}
                          alt={card.name}
                          width={200}
                          height={280}
                          className="w-full h-auto rounded border border-gray-200 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=280&width=200"
                          }}
                        />
                        {/* 枚数バッジ */}
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                          {card.quantity}
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{card.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
