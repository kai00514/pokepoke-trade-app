"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, MessageSquare, UserCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
  rawData?: any
}

interface TradePostCardProps {
  post: TradePost
}

export default function TradePostCard({ post }: TradePostCardProps) {
  const { toast } = useToast()

  const handleCopyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    navigator.clipboard.writeText(post.postId)
    toast({
      title: "コピーしました",
      description: `ID: ${post.postId} をクリップボードにコピーしました。`,
    })
  }

  // 複数カード表示用
  const wantedCards = post.rawData?.wantedCards || []
  const offeredCards = post.rawData?.offeredCards || []

  const statusStyles =
    post.status === "募集中"
      ? "bg-[#3B82F6] text-white border-transparent"
      : post.status === "進行中"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : post.status === "完了"
          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
          : "bg-gray-100 text-gray-700 border-gray-200"

  return (
    <Card className="relative w-full border border-[#3d496e] bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl">
      {/* Status Badge in the top-right */}
      <div className="absolute right-3 top-3 z-10">
        <Badge variant="outline" className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles}`}>
          {post.status}
        </Badge>
      </div>

      <Link href={`/trades/${post.id}`} className="block">
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
                  {post.username || "ユーザー"} ・ {post.date}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-1 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-2">
            {/* Wanted Cards */}
            <div className="space-y-2 md:pr-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#1D4ED8]">求めるカード</h3>
              </div>
              <div className="rounded-lg border border-[#3d496e] bg-[#F8FBFF] pt-2 pb-2 pl-2 pr-2 flex flex-nowrap overflow-x-auto gap-2 items-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                {wantedCards.length > 0 ? (
                  wantedCards.map((card: any) => (
                    <div key={card.id} className="flex-shrink-0 flex flex-col items-center">
                      <Image
                        src={card.imageUrl || "/placeholder.svg?width=80&height=112&query=pokemon-card"}
                        alt={card.name}
                        width={80}
                        height={112}
                        className="rounded-md object-contain border border-[#E5E7EB] bg-white mb-1"
                      />
                      <p className="text-xs font-semibold text-[#374151] text-center max-w-[80px] truncate">
                        {card.name}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#6B7280]">該当なし</p>
                )}
              </div>
            </div>

            {/* Offered Cards */}
            <div className="space-y-2 md:pl-3 md:border-l">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#0EA5E9]">譲れるカード</h3>
              </div>
              <div className="rounded-lg border border-[#3d496e] bg-[#F7FAFF] pt-2 pb-2 pl-2 pr-2 flex flex-nowrap overflow-x-auto gap-2 items-center scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                {offeredCards.length > 0 ? (
                  offeredCards.map((card: any) => (
                    <div key={card.id} className="flex-shrink-0 flex flex-col items-center">
                      <Image
                        src={card.imageUrl || "/placeholder.svg?width=80&height=112&query=pokemon-card"}
                        alt={card.name}
                        width={80}
                        height={112}
                        className="rounded-md object-contain border border-[#E5E7EB] bg-white mb-1"
                      />
                      <p className="text-xs font-semibold text-[#374151] text-center max-w-[80px] truncate">
                        {card.name}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#6B7280]">該当なし</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Link>

      <CardFooter className="bg-[#F8FAFC] px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 rounded-b-xl border-t border-[#3d496e] mx-1">
        <div className="flex items-center gap-2">
          <p className="text-xs text-[#6B7280]">ID: {post.postId}</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-auto py-1 px-2 text-[#1F2937] hover:bg-[#E5F0FF]"
            onClick={handleCopyToClipboard}
          >
            <Copy className="mr-1 h-3 w-3" /> コピー
          </Button>
        </div>
        <Button
          asChild
          variant="default"
          size="sm"
          className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs h-auto py-1.5 px-3 rounded-md"
        >
          <Link href={`/trades/${post.id}`}>
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            詳細
            {post.comments > 0 && (
              <span className="ml-1.5 bg-white text-[#1D4ED8] text-xs font-bold px-1.5 py-0.5 rounded-full">
                {post.comments}
              </span>
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
