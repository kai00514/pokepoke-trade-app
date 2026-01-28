"use client"
import { useEffect } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"

interface DeckCardWithDetails {
  card_id: number
  quantity: number
  name: string
  image_url: string
  thumb_url?: string
  pack_name?: string
}

interface DeckCardsGridProps {
  deckName: string
  energyType: string
  energyImage?: string
  cards: DeckCardWithDetails[]
}

export function DeckCardsGrid({ deckName, energyType, energyImage, cards }: DeckCardsGridProps) {
  const t = useTranslations()
  useEffect(() => {
    console.log("DeckCardsGrid received cards prop:", cards)
  }, [cards])

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{t('decks.noRecipe')}</p>
      </div>
    )
  }

  const gridCards: (DeckCardWithDetails | null)[] = Array(20).fill(null)
  let currentGridIndex = 0
  cards.forEach((card) => {
    for (let i = 0; i < card.quantity; i++) {
      if (currentGridIndex < 20) {
        gridCards[currentGridIndex] = card
        currentGridIndex++
      } else {
        break
      }
    }
  })

  return (
    <div>
      <div className="bg-gray-50 px-4 rounded-lg mb-4">
        <div className="flex items-center gap-4 mb-2">
          <h4 className="font-medium text-lg">{deckName}</h4>
          <div className="flex items-center gap-2">
            {energyImage && (
              <Image
                src={energyImage || "/placeholder.svg"}
                alt={energyType}
                width={20}
                height={20}
                className="w-5 h-5"
              />
            )}
            <span className="text-sm text-gray-600">{energyType}タイプ</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-10 gap-2 mb-4" style={{ minWidth: "1000px" }}>
          {gridCards.map((card, index) => (
            <div key={index} className="aspect-[7/10] relative">
              {card ? (
                <div className="relative w-full h-full">
                  <Image
                    src={card.image_url || "/placeholder.svg?height=180&width=130&query=カード"}
                    alt={card.name || "カード"}
                    fill
                    className="object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=180&width=130"
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-lg border-2 border-dashed border-gray-300"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
