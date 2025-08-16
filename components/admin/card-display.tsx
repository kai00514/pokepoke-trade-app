"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface CardDisplayProps {
  cardId: number
  useThumb?: boolean
  className?: string
}

interface Card {
  id: number
  name: string
  game8_image_url?: string
  thumb_image_url?: string
}

export function CardDisplay({ cardId, useThumb = false, className = "" }: CardDisplayProps) {
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("cards")
          .select("id, name, game8_image_url, thumb_image_url")
          .eq("id", cardId)
          .single()

        if (error) {
          console.error("Error fetching card:", error)
          setError(true)
        } else {
          setCard(data)
        }
      } catch (err) {
        console.error("Error:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchCard()
  }, [cardId])

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse rounded ${className}`}>
        <div className="w-full h-full bg-gray-300 rounded"></div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className={`bg-gray-100 border border-gray-300 rounded flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-500">No Image</span>
      </div>
    )
  }

  const imageUrl = useThumb ? card.thumb_image_url : card.game8_image_url
  const fallbackUrl = "/placeholder.svg?height=100&width=70&text=Card"

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageUrl || fallbackUrl}
        alt={card.name}
        className="w-full h-full object-cover rounded"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = fallbackUrl
        }}
      />
    </div>
  )
}
