"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Heart, Star, MessageCircle, CalendarDays, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  likeDeck,
  unlikeDeck,
  favoriteDeck,
  unfavoriteDeck,
  isFavorited as checkIsFavorited,
} from "@/lib/services/deck-service"
import LoginPromptModal from "@/components/ui/login-prompt-modal"
import type { Deck } from "@/components/deck-card"
import type { Card as PokeCard } from "@/types/card"
import { cn } from "@/lib/utils"

// Helper: expand deck_cards by quantity and cut to max 20
function expandDeckCards(deck: Deck, max = 20): number[] {
  if (!deck?.deck_cards || deck.deck_cards.length === 0) return []
  const expanded: number[] = []
  for (const { card_id, quantity } of deck.deck_cards) {
    for (let i = 0; i < Math.max(1, quantity); i++) {
      expanded.push(card_id)
      if (expanded.length >= max) break
    }
    if (expanded.length >= max) break
  }
  return expanded
}

type CardWithImage = {
  id: number
  name: string
  image_url?: string
  thumb_url?: string
  quantity?: number
}

interface DeckHorizontalRowProps {
  deck: Deck
  currentCategory?: string
  onCountUpdate?: (deckId: string, likeCount: number, favoriteCount: number) => void
  onRemoveFavorite?: (deckId: string) => void
}

export default function DeckHorizontalRow({
  deck,
  currentCategory = "posts",
  onCountUpdate,
  onRemoveFavorite,
}: DeckHorizontalRowProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [likeCount, setLikeCount] = useState(deck.likes || deck.like_count || 0)
  const [favoriteCount, setFavoriteCount] = useState(deck.favorites || deck.favorite_count || 0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginModalType, setLoginModalType] = useState<"like" | "favorite">("like")
  const [cards, setCards] = useState<CardWithImage[] | null>(null)
  const [cardsLoading, setCardsLoading] = useState(false)

  const linkHref = deck.is_deck_page ? `/content/${deck.id}` : `/decks/${deck.id}`
  const deckName = deck.title || deck.name || deck.deck_name || "無題のデッキ"
  const updatedDate = deck.updated_at || deck.updatedAt || deck.created_at || new Date().toISOString()

  // Status badge (example for favorites tab)
  const statusBadge = useMemo(() => {
    if (deck.source_tab === "お気に入り") {
      if (deck.is_deck_page && deck.category) {
        switch (deck.category) {
          case "tier":
            return { text: "Tier", variant: "outline" as const }
          case "features":
            return { text: "注目", variant: "outline" as const }
          case "newpack":
            return { text: "新パック", variant: "outline" as const }
        }
      } else if (!deck.is_deck_page) {
        return { text: "投稿", variant: "outline" as const }
      }
    }
    return null
  }, [deck.source_tab, deck.is_deck_page, deck.category])

  // Fetch login-dependent states
  useEffect(() => {
    if (user && deck.id) {
      const likeKey = `like_${user.id}_${deck.id}`
      const savedLikeState = localStorage.getItem(likeKey)
      if (savedLikeState !== null) {
        setIsLiked(savedLikeState === "true")
      }
      ;(async () => {
        const favorited = await checkIsFavorited(deck.id, deck.is_deck_page || false)
        setIsFavorited(favorited)
      })()
    } else {
      setIsLiked(false)
      setIsFavorited(false)
    }
  }, [user]) // Removed deck from dependency array

  // Fetch up to 20 card images for the deck (no thumbnail fallback)
  useEffect(() => {
    const run = async () => {
      try {
        const expanded = expandDeckCards(deck, 20)
        if (!expanded.length) {
          setCards([])
          return
        }

        setCardsLoading(true)
        // Deduplicate for fetch
        const uniqueIds = Array.from(new Set(expanded))
        const { getCardsByIds } = await import("@/lib/card-api")
        const fetched: PokeCard[] = await getCardsByIds(uniqueIds)

        const byId = new Map<number, PokeCard>()
        fetched.forEach((c) => byId.set(Number(c.id), c))

        const quantities = expanded.reduce<Record<number, number>>((acc, id) => {
          acc[id] = (acc[id] || 0) + 1
          return acc
        }, {})

        const ordered: CardWithImage[] = []
        const seenForPosition: Record<number, number> = {}
        for (const id of expanded.slice(0, 20)) {
          seenForPosition[id] = (seenForPosition[id] || 0) + 1
          if (seenForPosition[id] > quantities[id]) continue
          const c = byId.get(Number(id))
          if (c) {
            ordered.push({
              id: Number(c.id),
              name: c.name || "カード",
              image_url: c.thumb_url || c.image_url,
              thumb_url: c.thumb_url,
            })
          } else {
            ordered.push({
              id: Number(id),
              name: "不明なカード",
              image_url: "/placeholder.svg?height=168&width=120",
            })
          }
          if (ordered.length >= 20) break
        }
        setCards(ordered)
      } catch {
        // On error, do not fallback to thumbnail; just show empty state.
        setCards([])
      } finally {
        setCardsLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.id])

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isLikeLoading) return
    setIsLikeLoading(true)

    const originalIsLiked = isLiked
    const originalLikeCount = likeCount

    setIsLiked(!isLiked)
    const newLikeCount = originalIsLiked ? likeCount - 1 : likeCount + 1
    setLikeCount(newLikeCount)

    try {
      const action = originalIsLiked ? unlikeDeck : likeDeck
      const result = await action(deck.id, deck.is_deck_page || false)
      if (result.error) {
        toast({ title: "エラー", description: result.error, variant: "destructive" })
        setIsLiked(originalIsLiked)
        setLikeCount(originalLikeCount)
      } else {
        onCountUpdate?.(deck.id, newLikeCount, favoriteCount)
        if (user) {
          const likeKey = `like_${user.id}_${deck.id}`
          localStorage.setItem(likeKey, (!originalIsLiked).toString())
        }
      }
    } catch {
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
      setIsLiked(originalIsLiked)
      setLikeCount(originalLikeCount)
    } finally {
      setIsLikeLoading(false)
    }
  }

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      setLoginModalType("favorite")
      setShowLoginModal(true)
      return
    }
    if (isFavoriteLoading) return
    setIsFavoriteLoading(true)

    const originalIsFavorited = isFavorited
    const originalFavoriteCount = favoriteCount

    setIsFavorited(!isFavorited)
    const newFavoriteCount = originalIsFavorited ? favoriteCount - 1 : favoriteCount + 1
    setFavoriteCount(newFavoriteCount)

    try {
      const action = originalIsFavorited ? unfavoriteDeck : favoriteDeck
      const result = originalIsFavorited
        ? await action(deck.id, deck.is_deck_page || false)
        : await action(deck.id, currentCategory, deck.is_deck_page || false)

      if (result.error) {
        toast({ title: "エラー", description: result.error, variant: "destructive" })
        setIsFavorited(originalIsFavorited)
        setFavoriteCount(originalFavoriteCount)
      } else {
        onCountUpdate?.(deck.id, likeCount, newFavoriteCount)
        if (originalIsFavorited && onRemoveFavorite) {
          onRemoveFavorite(deck.id)
        }
      }
    } catch {
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
      setIsFavorited(originalIsFavorited)
      setFavoriteCount(originalFavoriteCount)
    } finally {
      setIsFavoriteLoading(false)
    }
  }

  return (
    <Card className="bg-white/90 border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href={linkHref} className="text-blue-700 hover:text-blue-800 font-semibold tracking-tight truncate">
            {deckName}
          </Link>
          {statusBadge && <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>}
        </div>
        <div className="flex items-center text-xs text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          <span>更新: {new Date(updatedDate).toLocaleDateString("ja-JP")}</span>
        </div>
      </div>

      {/* Horizontal scroller of cards (no thumbnail fallback) */}
      <div className="relative px-2 py-3">
        <div
          className={cn(
            "flex gap-3 overflow-x-auto px-2",
            "scroll-smooth",
            "[-ms-overflow-style:none] [scrollbar-width:none]",
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-label="デッキのカード一覧 横スクロール"
        >
          <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

          {cardsLoading && (
            <>
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="relative flex-shrink-0 w-[96px] aspect-[5/7] rounded-md bg-slate-100 border border-slate-200 animate-pulse"
                />
              ))}
            </>
          )}

          {!cardsLoading && cards && cards.length > 0 && (
            <>
              {cards.map((c, idx) => (
                <div key={`${c.id}-${idx}`} className="relative flex-shrink-0">
                  <div className="relative w-[96px] aspect-[5/7] rounded-md border border-slate-200 bg-slate-50 overflow-hidden">
                    <Image
                      src={c.image_url || "/placeholder.svg?height=168&width=120&query=card"}
                      alt={c.name || "カード"}
                      fill
                      sizes="96px"
                      className="object-contain"
                    />
                  </div>
                </div>
              ))}
            </>
          )}

          {!cardsLoading && cards && cards.length === 0 && (
            <div className="py-6 px-3 text-sm text-slate-500">カード情報がありません</div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="flex items-center gap-4 text-slate-600">
          <button
            onClick={handleLike}
            disabled={isLikeLoading}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
              isLikeLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-50",
              isLiked ? "text-red-500" : "text-slate-700",
            )}
            title="いいね"
          >
            {isLikeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
            )}
            <span className="text-sm">{likeCount}</span>
          </button>

          <button
            onClick={handleFavorite}
            disabled={isFavoriteLoading}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
              isFavoriteLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-50",
              isFavorited ? "text-yellow-500" : "text-slate-700",
            )}
            title="お気に入り"
          >
            {isFavoriteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
            )}
            <span className="text-sm">{favoriteCount}</span>
          </button>

          <div className="flex items-center gap-1 text-slate-700" title="コメント数">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm">{deck.comments || deck.comment_count || 0}</span>
          </div>
        </div>

        <Link
          href={linkHref}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline"
        >
          詳細を見る
        </Link>
      </div>

      {/* Login modal */}
      {showLoginModal && (
        <LoginPromptModal
          onClose={() => setShowLoginModal(false)}
          onContinueAsGuest={() => setShowLoginModal(false)}
          showContinueAsGuest={loginModalType === "like"}
        />
      )}
    </Card>
  )
}
