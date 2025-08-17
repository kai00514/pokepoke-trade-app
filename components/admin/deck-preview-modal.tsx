"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Bookmark, Eye, X, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"

interface DeckCard {
  id: number
  card_id: number
  card_name: string
  pack_name: string
  card_count: number
  display_order: number
}

interface StrengthWeakness {
  id: number
  title: string
  description: string
  image_urls: string[]
  display_order: number
}

interface PlayStep {
  id: number
  step_number: number
  title: string
  description: string
  image_urls: string[]
}

interface DeckPreviewModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  formData: {
    title: string
    deck_name: string
    deck_description: string
    deck_badge: string
    energy_type: string
    evaluation_title: string
    tier_rank: string
    tier_name: string
    tier_descriptions: string[]
    section1_title: string
    section2_title: string
    section3_title: string
    stats: {
      accessibility: number
      speed: number
      power: number
      durability: number
      stability: number
    }
  }
  deckCards: DeckCard[]
  strengthsWeaknesses: StrengthWeakness[]
  playSteps: PlayStep[]
}

interface CardData {
  id: number
  name: string
  image_url: string
  thumb_url?: string
  type_code?: string
  rarity_code?: string
}

export function DeckPreviewModal({
  isOpen,
  onOpenChange,
  formData,
  deckCards,
  strengthsWeaknesses,
  playSteps,
}: DeckPreviewModalProps) {
  const [cardData, setCardData] = useState<Record<number, CardData>>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // エネルギータイプのアイコンマッピング
  const energyTypeIcons: Record<string, string> = {
    炎: "/images/types/炎.png",
    水: "/images/types/水.png",
    草: "/images/types/草.png",
    電気: "/images/types/電気.png",
    エスパー: "/images/types/念.png",
    格闘: "/images/types/格闘.png",
    悪: "/images/types/悪.png",
    鋼: "/images/types/鋼.png",
    無色: "/images/types/無色.png",
    ドラゴン: "/images/types/龍.png",
  }

  // カードデータを取得
  useEffect(() => {
    async function fetchCardData() {
      if (!isOpen || deckCards.length === 0) return

      setLoading(true)
      try {
        const cardIds = deckCards.map((card) => card.card_id)
        const { data, error } = await supabase
          .from("cards")
          .select("id, name, image_url, thumb_url, type_code, rarity_code")
          .in("id", cardIds)

        if (error) {
          console.error("Error fetching card data:", error)
        } else if (data) {
          const cardMap: Record<number, CardData> = {}
          data.forEach((card) => {
            cardMap[card.id] = card
          })
          setCardData(cardMap)
        }
      } catch (error) {
        console.error("Error fetching card data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCardData()
  }, [isOpen, deckCards])

  // デッキカードを20枚のグリッド用に変換
  const createDeckGrid = () => {
    const gridCards: (DeckCard & { cardData?: CardData })[] = []

    // display_orderでソート
    const sortedCards = [...deckCards].sort((a, b) => a.display_order - b.display_order)

    sortedCards.forEach((card) => {
      for (let i = 0; i < card.card_count; i++) {
        if (gridCards.length < 20) {
          gridCards.push({
            ...card,
            cardData: cardData[card.card_id],
          })
        }
      }
    })

    // 20枚に満たない場合は空のスロットで埋める
    while (gridCards.length < 20) {
      gridCards.push(null as any)
    }

    return gridCards
  }

  const gridCards = createDeckGrid()
  const totalCards = deckCards.reduce((sum, card) => sum + card.card_count, 0)

  // ステータス表示用のラベル
  const statLabels = {
    accessibility: "アクセス性",
    speed: "スピード",
    power: "パワー",
    durability: "耐久性",
    stability: "安定性",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 border-b flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-2">{formData.deck_name || "デッキ名未設定"}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>作成者: プレビューユーザー</span>
                <span>作成日: {new Date().toLocaleDateString("ja-JP")}</span>
                <Badge variant="outline">{formData.energy_type}タイプ</Badge>
                {formData.deck_badge && <Badge variant="secondary">{formData.deck_badge}</Badge>}
              </div>
              <p className="text-gray-700 leading-relaxed">
                {formData.deck_description || "デッキの説明が入力されていません"}
              </p>
            </div>
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-6 w-6" />
              <span className="sr-only">閉じる</span>
            </DialogClose>
          </div>

          {/* アクションボタン（プレビューでは無効化） */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" disabled className="flex items-center gap-2 bg-transparent">
              <Heart className="h-4 w-4" />
              いいね (0)
            </Button>
            <Button variant="outline" disabled className="flex items-center gap-2 bg-transparent">
              <Bookmark className="h-4 w-4" />
              お気に入り (0)
            </Button>
            <Button variant="outline" disabled className="flex items-center gap-2 bg-transparent">
              <Eye className="h-4 w-4" />
              閲覧数 (0)
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* デッキ構成セクション */}
            <section>
              <h2 className="text-xl font-bold mb-4">
                {formData.section1_title || `${formData.deck_name}のレシピと評価`}
              </h2>

              {/* デッキカードグリッド */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-medium text-lg">{formData.deck_name}</h3>
                  <div className="flex items-center gap-2">
                    {energyTypeIcons[formData.energy_type] && (
                      <Image
                        src={energyTypeIcons[formData.energy_type] || "/placeholder.svg"}
                        alt={formData.energy_type}
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                    )}
                    <span className="text-sm text-gray-600">{formData.energy_type}タイプ</span>
                  </div>
                  <Badge variant="outline">{totalCards}/20枚</Badge>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">カード情報を読み込み中...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-10 gap-2">
                    {gridCards.map((card, index) => (
                      <div key={index} className="aspect-[7/10] relative">
                        {card && card.cardData ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={card.cardData.thumb_url || card.cardData.image_url || "/placeholder.svg"}
                              alt={card.cardData.name}
                              fill
                              className="object-cover rounded-lg shadow-sm"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=140&width=100"
                              }}
                            />
                          </div>
                        ) : card ? (
                          <div className="w-full h-full bg-gray-300 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-600">読み込み中</span>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-lg border-2 border-dashed border-gray-300"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* カードリスト */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">全てのカード</TabsTrigger>
                  <TabsTrigger value={formData.energy_type}>{formData.energy_type}タイプ</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="space-y-2">
                    {deckCards.map((card) => {
                      const data = cardData[card.card_id]
                      return (
                        <div key={card.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-12 h-16 relative flex-shrink-0">
                            {data ? (
                              <Image
                                src={data.thumb_url || data.image_url || "/placeholder.svg"}
                                alt={data.name}
                                fill
                                className="object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-xs">📷</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{data?.name || card.card_name}</div>
                            <div className="text-sm text-gray-600">{card.pack_name}</div>
                          </div>
                          <Badge variant="outline">×{card.card_count}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value={formData.energy_type} className="mt-4">
                  <div className="space-y-2">
                    {deckCards
                      .filter((card) => {
                        const data = cardData[card.card_id]
                        return data?.type_code === formData.energy_type
                      })
                      .map((card) => {
                        const data = cardData[card.card_id]
                        return (
                          <div key={card.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-12 h-16 relative flex-shrink-0">
                              <Image
                                src={data?.thumb_url || data?.image_url || "/placeholder.svg"}
                                alt={data?.name || card.card_name}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{data?.name || card.card_name}</div>
                              <div className="text-sm text-gray-600">{card.pack_name}</div>
                            </div>
                            <Badge variant="outline">×{card.card_count}</Badge>
                          </div>
                        )
                      })}
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {/* 評価セクション */}
            {formData.evaluation_title && (
              <section>
                <h2 className="text-xl font-bold mb-4">{formData.evaluation_title}</h2>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-white font-bold text-lg",
                          formData.tier_rank === "SS" && "bg-red-500",
                          formData.tier_rank === "S" && "bg-orange-500",
                          formData.tier_rank === "A" && "bg-yellow-500",
                          formData.tier_rank === "B" && "bg-green-500",
                          formData.tier_rank === "C" && "bg-blue-500",
                        )}
                      >
                        {formData.tier_rank}
                      </span>
                      {formData.tier_name && <span>{formData.tier_name}</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formData.tier_descriptions.length > 0 && (
                      <div className="space-y-2 mb-6">
                        {formData.tier_descriptions.map((desc, index) => (
                          <p key={index} className="text-gray-700">
                            {desc}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {Object.entries(formData.stats).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-sm text-gray-600 mb-1">{statLabels[key as keyof typeof statLabels]}</div>
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-4 w-4",
                                  star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
                                )}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{value}/5</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* 強み・弱みセクション */}
            {strengthsWeaknesses.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">
                  {formData.section2_title || `${formData.deck_name}の強い点・弱い点`}
                </h2>

                <div className="space-y-6">
                  {strengthsWeaknesses
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((item, index) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-6">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            {index + 1}
                          </span>
                          {item.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed mb-4">{item.description}</p>

                        {item.image_urls.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {item.image_urls.map((url, imgIndex) => (
                              <div key={imgIndex} className="w-16 h-20 relative">
                                <Image
                                  src={url || "/placeholder.svg"}
                                  alt=""
                                  fill
                                  className="object-cover rounded border"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* プレイ方法セクション */}
            {playSteps.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">{formData.section3_title || `${formData.deck_name}の回し方`}</h2>

                <div className="space-y-6">
                  {playSteps
                    .sort((a, b) => a.step_number - b.step_number)
                    .map((step) => (
                      <div key={step.id} className="bg-white border border-slate-200 rounded-lg p-6">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <span className="bg-green-600 text-white rounded-full px-3 py-1 text-sm">
                            STEP {step.step_number}
                          </span>
                          {step.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed mb-4">{step.description}</p>

                        {step.image_urls.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {step.image_urls.map((url, imgIndex) => (
                              <div key={imgIndex} className="w-16 h-20 relative">
                                <Image
                                  src={url || "/placeholder.svg"}
                                  alt=""
                                  fill
                                  className="object-cover rounded border"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
