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
import type { CardData } from "@/lib/card-api"
import { getCardsByIds } from "@/lib/card-api"
import { cn } from "@/lib/utils"

// 20枚選定ロジック
function selectTwentyCardIds(deck: Deck, max = 20): number[] {
  // 1) selected_card_ids を最優先（順序維持、足りなければ循環）
  const selected = (deck as any).selected_card_ids as number[] | undefined
  if (selected && selected.length > 0) {
    const base = selected.slice(0, max)
    if (base.length === max) return base
    // 足りない分は先頭から循環して埋める
    const filled: number[] = [...base]
    let i = 0
    while (filled.length < max) {
      filled.push(selected[i % selected.length])
      i++
    }
    return filled.slice(0, max)
  }

  // 2) deck_cards を数量展開 → 20件に満たなければ循環して20件に
  const expanded: number[] = []
  if ((deck as any).deck_cards && Array.isArray((deck as any).deck_cards)) {
    for (const item of (deck as any).deck_cards as { card_id: number; quantity?: number }[]) {
      const qty = Math.max(1, Number(item.quantity ?? 1))
      for (let i = 0; i < qty; i++) {
        expanded.push(Number(item.card_id))
        if (expanded.length >= max) break
      }
      if (expanded.length >= max) break
    }
  }

  if (expanded.length > 0) {
    if (expanded.length >= max) return expanded.slice(0, max)
    const filled: number[] = [...expanded]
    let i = 0
    while (filled.length < max) {
      filled.push(expanded[i % expanded.length])
      i++
    }
    return filled.slice(0, max)
  }

  // 3) 何も無い場合は 0 を20個（後段でプレースホルダーに置換）
  return Array.from({ length: max }, () => 0)
}

type CardTile = {
  id: number
  name: string
  image_url?: string
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
  const [likeCount, setLikeCount] = useState(deck.likes || (deck as any).like_count || 0)
  const [favoriteCount, setFavoriteCount] = useState(deck.favorites || (deck as any).favorite_count || 0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginModalType, setLoginModalType] = useState<"like" | "favorite">("like")

  const [cards, setCards] = useState<CardTile[] | null>(null)
  const [cardsLoading, setCardsLoading] = useState(false)

  const linkHref = (deck as any).is_deck_page ? `/content/${deck.id}` : `/decks/${deck.id}`
  const deckName = (deck as any).title || deck.name || (deck as any).deck_name || "無題のデッキ"
  const updatedDate =
    (deck as any).updated_at || (deck as any).updatedAt || (deck as any).created_at || new Date().toISOString()

  // 任意のバッジ（例: お気に入りタブ経由など）
  const statusBadge = useMemo(() => {
    if ((deck as any).source_tab === "お気に入り") {
      if ((deck as any).is_deck_page && (deck as any).category) {
        switch ((deck as any).category) {
          case "tier":
            return { text: "Tier", variant: "outline" as const }
          case "features":
            return { text: "注目", variant: "outline" as const }
          case "newpack":
            return { text: "新パック", variant: "outline" as const }
        }
      } else if (!(deck as any).is_deck_page) {
        return { text: "投稿", variant: "outline" as const }
      }
    }
    return null
  }, [deck])

  // ログイン依存ステートの初期化
  useEffect(() => {
    if (user && deck.id) {
      const likeKey = `like_${user.id}_${deck.id}`
      const savedLikeState = typeof window !== "undefined" ? localStorage.getItem(likeKey) : null
      if (savedLikeState !== null) {
        setIsLiked(savedLikeState === "true")
      }
      ;(async () => {
        const favorited = await checkIsFavorited(deck.id, Boolean((deck as any).is_deck_page))
        setIsFavorited(favorited)
      })()
    } else {
      setIsLiked(false)
      setIsFavorited(false)
    }
  }, [user, deck.id])

  // 20枚のカードを用意して描画（常に20枚に満たす）
  useEffect(() => {
    let mounted = true
    const run = async () => {
      setCardsLoading(true)
      try {
        const twentyIds = selectTwentyCardIds(deck, 20) // 20件を確定
        const uniqueRealIds = Array.from(new Set(twentyIds.filter((id) => id && id > 0)))
        // 実IDが無い場合（全て0の時）は、プレースホルダー20枚を生成
        if (uniqueRealIds.length === 0) {
          const placeholders: CardTile[] = Array.from({ length: 20 }, (_, i) => ({
            id: 0 - i, // 負のIDで一意に
            name: "プレースホルダー",
            image_url: "/placeholder.svg?height=168&width=120",
          }))
          if (mounted) setCards(placeholders)
          return
        }

        const fetched = await getCardsByIds(uniqueRealIds)
        const byId = new Map<number, CardData>()
        fetched.forEach((c) => byId.set(Number(c.id), c))

        // twentyIds の順序通りに20枚を組み立て、欠落はプレースホルダーで補完
        const tiles: CardTile[] = twentyIds.map((id, idx) => {
          if (id && byId.has(id)) {
            const c = byId.get(id)!
            return {
              id: c.id,
              name: c.name || "カード",
              image_url: c.thumb_url || c.image_url || "/placeholder.svg?height=168&width=120",
            }
          }
          return {
            id: 0 - idx,
            name: "不明なカード",
            image_url: "/placeholder.svg?height=168&width=120",
          }
        })

        if (mounted) setCards(tiles)
      } catch (e) {
        console.error("Failed to build 20 cards:", e)
        // 失敗時も20枚のプレースホルダーを返す
        const placeholders: CardTile[] = Array.from({ length: 20 }, (_, i) => ({
          id: 0 - i,
          name: "エラー",
          image_url: "/placeholder.svg?height=168&width=120",
        }))
        if (mounted) setCards(placeholders)
      } finally {
        if (mounted) setCardsLoading(false)
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [deck.id, (deck as any).selected_card_ids, JSON.stringify((deck as any).deck_cards)])

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
      const result = await action(deck.id, Boolean((deck as any).is_deck_page))
      if ((result as any).error) {
        setIsLiked(originalIsLiked)
        setLikeCount(originalLikeCount)
        toast({ title: "エラー", description: (result as any).error, variant: "destructive" })
      } else {
        onCountUpdate?.(deck.id, newLikeCount, favoriteCount)
        if (user) {
          const likeKey = `like_${user.id}_${deck.id}`
          localStorage.setItem(likeKey, (!originalIsLiked).toString())
        }
      }
    } catch {
      setIsLiked(originalIsLiked)
      setLikeCount(originalLikeCount)
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
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
        ? await action(deck.id, Boolean((deck as any).is_deck_page))
        : await action(deck.id, currentCategory, Boolean((deck as any).is_deck_page))
      if ((result as any).error) {
        setIsFavorited(originalIsFavorited)
        setFavoriteCount(originalFavoriteCount)
        toast({ title: "エラー", description: (result as any).error, variant: "destructive" })
      } else {
        onCountUpdate?.(deck.id, likeCount, newFavoriteCount)
        if (originalIsFavorited && onRemoveFavorite) onRemoveFavorite(deck.id)
      }
    } catch {
      setIsFavorited(originalIsFavorited)
      setFavoriteCount(originalFavoriteCount)
      toast({ title: "エラー", description: "操作に失敗しました", variant: "destructive" })
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

      {/* Horizontal scroller of 20 cards (always 20 tiles) */}
      <div className="relative px-2 py-3">
        <div
          className={cn(
            "no-scrollbar flex gap-3 overflow-x-auto px-2",
            "scroll-smooth",
            "[-ms-overflow-style:none] [scrollbar-width:none]",
          )}
          style={{ WebkitOverflowScrolling: "touch" }}
          aria-label="デッキのカード一覧 横スクロール"
        >
          <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

          {cardsLoading && (
            <>
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={`s-${i}`}
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
                      loading={idx < 6 ? "eager" : "lazy"}
                      sizes="96px"
                      className="object-contain"
                    />
                  </div>
                </div>
              ))}
            </>
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
            aria-label="いいね"
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
            aria-label="お気に入り"
          >
            {isFavoriteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} />
            )}
            <span className="text-sm">{favoriteCount}</span>
          </button>

          <div className="flex items-center gap-1 text-slate-700" title="コメント数" aria-label="コメント数">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm">{(deck as any).comments || (deck as any).comment_count || 0}</span>
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
