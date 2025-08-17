"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Bookmark, Star, X } from "lucide-react"
import { fetchCardDetailsByIds, type CardData } from "@/lib/card-api"

interface DeckPreviewModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: any
  deckCards: any[]
  strengthsWeaknesses: any[]
  playSteps: any[]
}

export function DeckPreviewModal({
  isOpen,
  onOpenChange,
  formData,
  deckCards,
  strengthsWeaknesses,
  playSteps,
}: DeckPreviewModalProps) {
  const [cardDetails, setCardDetails] = useState<Map<number, CardData>>(new Map())
  const [activeTab, setActiveTab] = useState("grid")

  // カード詳細情報を取得
  useEffect(() => {
    const fetchCardDetails = async () => {
      if (deckCards.length === 0) return

      const cardIds = deckCards.map((card) => String(card.card_id))
      try {
        const details = await fetchCardDetailsByIds(cardIds)
        const detailsMap = new Map<number, CardData>()
        details.forEach((detail) => {
          detailsMap.set(detail.id, detail)
        })
        setCardDetails(detailsMap)
      } catch (error) {
        console.error("Failed to fetch card details:", error)
      }
    }

    if (isOpen) {
      fetchCardDetails()
    }
  }, [isOpen, deckCards])

  // カードグリッド（10×2）を生成
  const generateCardGrid = () => {
    const grid = Array(20).fill(null)
    let cardIndex = 0

    // display_orderでソートしてからグリッドに配置
    const sortedCards = [...deckCards].sort((a, b) => a.display_order - b.display_order)

    for (const card of sortedCards) {
      const detail = cardDetails.get(card.card_id)
      for (let i = 0; i < card.card_count && cardIndex < 20; i++) {
        grid[cardIndex] = {
          ...card,
          detail,
          gridIndex: cardIndex,
        }
        cardIndex++
      }
    }

    return grid
  }

  const cardGrid = generateCardGrid()
  const totalCards = deckCards.reduce((sum, card) => sum + card.card_count, 0)

  // ティアランクの色を取得
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "SS":
        return "bg-purple-600 text-white"
      case "S":
        return "bg-red-500 text-white"
      case "A":
        return "bg-orange-500 text-white"
      case "B":
        return "bg-yellow-500 text-black"
      case "C":
        return "bg-gray-500 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  // 星評価を生成
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>デッキプレビュー</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* ヘッダー部分 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {formData.deck_badge && <Badge variant="secondary">{formData.deck_badge}</Badge>}
              <Badge className={getTierColor(formData.tier_rank)}>{formData.tier_rank}</Badge>
              {formData.tier_name && <Badge variant="outline">{formData.tier_name}</Badge>}
            </div>

            <h1 className="text-2xl font-bold">{formData.deck_name || "デッキ名未設定"}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>作成者: 管理者</span>
              <span>更新日: {new Date().toLocaleDateString("ja-JP")}</span>
              <span>カード枚数: {totalCards}/20枚</span>
            </div>

            {formData.deck_description && <p className="text-gray-700 leading-relaxed">{formData.deck_description}</p>}

            {/* アクションボタン（無効化状態） */}
            <div className="flex gap-2">
              <Button variant="outline" disabled className="flex items-center gap-2 bg-transparent">
                <Heart className="h-4 w-4" />
                いいね 0
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2 bg-transparent">
                <Bookmark className="h-4 w-4" />
                お気に入り 0
              </Button>
            </div>
          </div>

          {/* カード構成セクション */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {formData.section1_title || `${formData.deck_name}のレシピと評価`}
              </h2>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="grid">カードグリッド</TabsTrigger>
                  <TabsTrigger value="list">カードリスト</TabsTrigger>
                </TabsList>

                <TabsContent value="grid" className="mt-4">
                  <div className="grid grid-cols-10 gap-1 mb-4">
                    {cardGrid.map((card, index) => (
                      <div key={index} className="aspect-[7/10] bg-gray-100 rounded border">
                        {card ? (
                          <img
                            src={
                              card.detail?.thumb_url || card.detail?.image_url || "/placeholder.svg?height=100&width=70"
                            }
                            alt={card.detail?.name || card.card_name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">空</div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 p-2 bg-blue-50 rounded font-medium text-sm">
                      <div className="col-span-1 text-center">ID</div>
                      <div className="col-span-2 text-center">カード</div>
                      <div className="col-span-6 text-center">説明</div>
                      <div className="col-span-3 text-center">枚数</div>
                    </div>
                    {deckCards
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((card) => {
                        const detail = cardDetails.get(card.card_id)
                        return (
                          <div key={card.id} className="grid grid-cols-12 gap-2 p-2 border rounded items-center">
                            <div className="col-span-1 text-center text-sm">{card.card_id}</div>
                            <div className="col-span-2 flex flex-col items-center">
                              <img
                                src={detail?.thumb_url || detail?.image_url || "/placeholder.svg?height=60&width=42"}
                                alt={detail?.name || card.card_name}
                                className="w-10 h-14 object-cover rounded mb-1"
                              />
                              <span className="text-xs text-center">{detail?.name || card.card_name}</span>
                            </div>
                            <div className="col-span-6 text-center text-sm">{detail?.name || card.card_name}の説明</div>
                            <div className="col-span-3 text-center font-medium">{card.card_count}枚</div>
                          </div>
                        )
                      })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 評価セクション */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{formData.evaluation_title || `${formData.deck_name}の評価`}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">ティア評価</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getTierColor(formData.tier_rank)} size="lg">
                      {formData.tier_rank}
                    </Badge>
                    {formData.tier_name && <span className="text-sm text-gray-600">{formData.tier_name}</span>}
                  </div>
                  {formData.tier_descriptions.length > 0 && (
                    <ul className="text-sm text-gray-700 space-y-1">
                      {formData.tier_descriptions
                        .filter((desc: string) => desc.trim())
                        .map((desc: string, index: number) => (
                          <li key={index}>• {desc}</li>
                        ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">ステータス評価</h3>
                  <div className="space-y-2">
                    {Object.entries(formData.stats).map(([key, value]) => {
                      const labels = {
                        accessibility: "アクセス性",
                        speed: "スピード",
                        power: "パワー",
                        durability: "耐久性",
                        stability: "安定性",
                      }
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm">{labels[key as keyof typeof labels]}</span>
                          <div className="flex items-center gap-1">
                            {renderStars(value as number)}
                            <span className="text-sm text-gray-600 ml-1">{value}/5</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 強み・弱みセクション */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {formData.section2_title || `${formData.deck_name}の強い点・弱い点`}
              </h2>

              <div className="space-y-4">
                {strengthsWeaknesses
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">
                        {index + 1}. {item.title}
                      </h3>
                      <p className="text-gray-700 mb-3">{item.description}</p>
                      {item.image_urls.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {item.image_urls.map((url: string, imgIndex: number) => (
                            <img
                              key={imgIndex}
                              src={url || "/placeholder.svg"}
                              alt=""
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                {formData.strengths_weaknesses_list.some((item: string) => item.trim()) && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">要点まとめ</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {formData.strengths_weaknesses_list
                        .filter((item: string) => item.trim())
                        .map((item: string, index: number) => (
                          <li key={index}>• {item}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* プレイ方法セクション */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{formData.section3_title || `${formData.deck_name}の回し方`}</h2>

              <div className="space-y-4">
                {playSteps
                  .sort((a, b) => a.step_number - b.step_number)
                  .map((step) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">
                        STEP {step.step_number}: {step.title}
                      </h3>
                      <p className="text-gray-700 mb-3">{step.description}</p>
                      {step.image_urls.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {step.image_urls.map((url: string, imgIndex: number) => (
                            <img
                              key={imgIndex}
                              src={url || "/placeholder.svg"}
                              alt=""
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                {formData.how_to_play_list.some((item: string) => item.trim()) && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">プレイ方法まとめ</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {formData.how_to_play_list
                        .filter((item: string) => item.trim())
                        .map((item: string, index: number) => (
                          <li key={index}>• {item}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
