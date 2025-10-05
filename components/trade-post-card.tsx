"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, MessageCircle, Heart, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardDisplay } from "@/components/card-display"
import { formatDistanceToNowStrict } from "date-fns"
import { ja } from "date-fns/locale"
import type { Card } from "@/types/card"
import { ShareModal } from "@/components/share-modal"

interface TradePostCardProps {
  id: string
  wantedCards: Card[]
  offeredCards: Card[]
  comment: string
  createdAt: string
  userId: string
  userName?: string
  likeCount?: number
  commentCount?: number
  viewCount?: number
}

export function TradePostCard({
  id,
  wantedCards,
  offeredCards,
  comment,
  createdAt,
  userId,
  userName,
  likeCount = 0,
  commentCount = 0,
}: TradePostCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const timeAgo = formatDistanceToNowStrict(new Date(createdAt), {
    addSuffix: true,
    locale: ja,
  })

  const handleShare = () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/trades/${id}`
    setIsShareModalOpen(true)
  }

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/trades/${id}`
  const shareTitle = `${userName || "匿名ユーザー"}のトレード投稿`

  return (
    <>
      <Link
        href={`/trades/${id}`}
        className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-[#E5E7EB] overflow-hidden"
      >
        <div className="p-4">
          {/* ヘッダー */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white font-semibold text-sm">
                {userName ? userName[0].toUpperCase() : "U"}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">{userName || "匿名ユーザー"}</p>
                <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* カードセクション */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* 求めるカード */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <h3 className="text-xs font-semibold text-[#3B82F6]">求めるカード</h3>
              </div>
              <div className="aspect-[7/10] relative rounded-lg overflow-hidden bg-[#F9FAFB] border border-[#E5E7EB]">
                {wantedCards.length > 0 ? (
                  <CardDisplay card={wantedCards[0]} size="sm" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-[#9CA3AF]">
                    カードなし
                  </div>
                )}
                {wantedCards.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-semibold">
                    +{wantedCards.length - 1}
                  </div>
                )}
              </div>
            </div>

            {/* 譲れるカード */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <h3 className="text-xs font-semibold text-[#10B981]">譲れるカード</h3>
              </div>
              <div className="aspect-[7/10] relative rounded-lg overflow-hidden bg-[#F9FAFB] border border-[#E5E7EB]">
                {offeredCards.length > 0 ? (
                  <CardDisplay card={offeredCards[0]} size="sm" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-[#9CA3AF]">
                    カードなし
                  </div>
                )}
                {offeredCards.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-semibold">
                    +{offeredCards.length - 1}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* コメント */}
          {comment && (
            <div className="mb-3 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <p className="text-sm text-[#4B5563] line-clamp-2">{comment}</p>
            </div>
          )}

          {/* アクションバー */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#EF4444] transition-colors">
                <Heart className="w-4 h-4" />
                <span>{likeCount}</span>
              </button>
              <button className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#3B82F6] transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{commentCount}</span>
              </button>
            </div>
            <Button
              onClick={(e) => {
                e.preventDefault()
                handleShare()
              }}
              size="sm"
              className="text-xs h-8 px-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 font-semibold"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">シェア</span>
            </Button>
          </div>
        </div>
      </Link>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={shareUrl}
        title={shareTitle}
      />
    </>
  )
}
