"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "@/lib/i18n-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, MessageSquare, UserCircle, Share2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import ShareModal from "@/components/share-modal"
import { event as gtagEvent } from "@/lib/analytics/gtag"
import { useTranslations } from "next-intl"

type CardInfo = {
  name: string
  image: string
}

type TradePost = {
  id: string
  title: string
  date: string
  status: string
  wantedCard?: CardInfo
  offeredCard?: CardInfo
  comments: number
  postId: string
  username?: string
  avatarUrl?: string | null
  authorComment?: string | null
  rawData?: any
}

interface TradePostCardProps {
  post: TradePost
}

export default function TradePostCard({ post }: TradePostCardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const t = useTranslations()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const handleCopyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    navigator.clipboard.writeText(post.postId)
    toast({
      title: t("messages.success.copied"),
      description: t("idCopied", { id: post.postId }),
    })
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    gtagEvent("trade_share_clicked", {
      category: "engagement",
      trade_id: post.id,
      trade_title: post.title,
    })

    setIsShareModalOpen(true)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (post.rawData?.fullPostData) {
      try {
        const cacheKey = `trade-post-${post.id}`
        const cacheData = {
          ...post.rawData.fullPostData,
          cachedAt: Date.now(),
        }
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
        console.log(`[TradePostCard] Cached data for post ${post.id}`)
      } catch (error) {
        console.error("[TradePostCard] Failed to cache data:", error)
      }
    }

    router.push(`/trades/${post.id}`)
  }

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    handleCardClick(e)
  }

  const wantedCards = post.rawData?.wantedCards || []
  const offeredCards = post.rawData?.offeredCards || []

  // Map Japanese status to translation keys
  const getStatusKey = (status: string) => {
    switch (status) {
      case "募集中": return "status.recruiting"
      case "進行中": return "status.inProgress"
      case "完了": return "status.completedShort"
      case "キャンセル": return "status.canceled"
      default: return status
    }
  }

  const statusStyles =
    post.status === "募集中"
      ? "bg-[#3B82F6] text-white border-transparent"
      : post.status === "進行中"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : post.status === "完了"
          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
          : "bg-gray-100 text-gray-700 border-gray-200"

  const translatedStatus = t(getStatusKey(post.status))

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/trades/${post.id}`

  return (
    <>
      <Card className="relative w-full border border-[#3d496e] bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
        <div className="absolute right-3 top-3 z-10">
          <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles}`}>
            {translatedStatus}
          </Badge>
        </div>

        <div onClick={handleCardClick} className="block cursor-pointer">
          <CardHeader className>
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl font-semibold text-[#111827]">{post.title}</CardTitle>
                <div className="mt-1 flex items-center text-[#6B7280]">
                  {post.avatarUrl ? (
                    <Image
                      src={post.avatarUrl || "/placeholder.svg"}
                      alt={post.username || "ユーザー"}
                      width={20}
                      height={20}
                      className="rounded-full mr-2"
                    />
                  ) : (
                    <UserCircle className="h-5 w-5 text-slate-400 mr-2" />
                  )}
                  <p className="text-xs">
                    {post.username || t("user")} ・ {post.date}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-1 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-2">
              <div className="space-y-2 md:pr-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[#1D4ED8]">{t("trades.wantedCards")}</h3>
                </div>
                <div className="rounded-lg border border-[#3d496e] bg-[#F8FBFF] pt-2 pb-2 pl-2 pr-2 flex flex-nowrap overflow-x-auto gap-2 items-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  {wantedCards.length > 0 ? (
                    wantedCards.map((card: any, index: number) => (
                      <div key={`wanted-${card.id}-${index}`} className="flex-shrink-0 flex flex-col items-center">
                        <Image
                          src={card.imageUrl || "/placeholder.svg?width=72&height=100&query=pokemon-card"}
                          alt={card.name}
                          width={72}
                          height={100}
                          className="rounded-md object-contain border border-[#E5E7EB] bg-white mb-1"
                        />
                        <p className="text-xs font-semibold text-[#374151] text-center max-w-[72px] truncate">
                          {card.name}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <Image
                        src="/placeholder.svg"
                        alt={t("common.labels.negotiable")}
                        width={72}
                        height={100}
                        className="rounded-md object-contain border border-[#E5E7EB] bg-white mb-1"
                      />
                      <p className="text-xs font-semibold text-[#374151] text-center max-w-[72px] truncate">{t("common.labels.negotiable")}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:pl-3 md:border-l">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-[#0EA5E9]">{t("trades.offeredCardsAlt")}</h3>
                </div>
                <div className="rounded-lg border border-[#3d496e] bg-[#F7FAFF] pt-2 pb-2 pl-2 pr-2 flex flex-nowrap overflow-x-auto gap-2 items-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  {offeredCards.length > 0 ? (
                    offeredCards.map((card: any, index: number) => (
                      <div key={`offered-${card.id}-${index}`} className="flex-shrink-0 flex flex-col items-center">
                        <Image
                          src={card.imageUrl || "/placeholder.svg?width=72&height=100&query=pokemon-card"}
                          alt={card.name}
                          width={72}
                          height={100}
                          className="rounded-md object-contain border border-[#E5E7EB] bg-white mb-1"
                        />
                        <p className="text-xs font-semibold text-[#374151] text-center max-w-[72px] truncate">
                          {card.name}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <Image
                        src="/placeholder.svg"
                        alt={t("common.labels.negotiable")}
                        width={72}
                        height={100}
                        className="rounded-md object-contain border border-[#E5E7EB] bg-white mb-1"
                      />
                      <p className="text-xs font-semibold text-[#374151] text-center max-w-[72px] truncate">{t("common.labels.negotiable")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-[#F9FAFB] p-1 rounded-md text-sm text-[#6B7280] mb-3 border border-[#E5E7EB]">
              {post.authorComment ? (
                <div className="mb-1">
                  <p className="text-xs font-medium text-[#374151] mb-1">{t("trades.authorCommentWithText", { comment: post.authorComment })}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </div>

        <CardFooter className="bg-[#F8FAFC] px-4 py-3 flex items-center justify-between rounded-b-xl border-t border-[#3d496e] mx-1">
          <div className="flex items-center gap-2">
            <p className="text-xs text-[#6B7280]">ID: {post.postId}</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2 text-[#1F2937] hover:bg-[#E5F0FF]"
              onClick={handleCopyToClipboard}
            >
              <Copy className="mr-1 h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1.5 px-3 rounded-md transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
              onClick={handleShare}
            >
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              {t("common.buttons.share")}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs h-auto py-1.5 px-3 rounded-md"
              onClick={handleDetailsClick}
            >
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              {t("common.buttons.details")}
              {post.comments > 0 && (
                <span className="ml-1.5 bg-white text-[#1D4ED8] text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {post.comments}
                </span>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareUrl}
        title={post.title}
      />
    </>
  )
}
