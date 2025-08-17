"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Star, Heart, MessageCircle, Eye } from "lucide-react"
import CardDisplay from "@/components/card-display"

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
  const [activeTab, setActiveTab] = useState("overview")

  const totalCards = deckCards.reduce((sum, card) => sum + card.card_count, 0)

  const getStatColor = (value: number) => {
    if (value >= 4) return "bg-green-500"
    if (value >= 3) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStatLabel = (key: string) => {
    const labels = {
      accessibility: "アクセス性",
      speed: "スピード",
      power: "パワー",
      durability: "耐久性",
      stability: "安定性",
    }
    return labels[key as keyof typeof labels] || key
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>デッキプレビュー</span>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              ×
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ヘッダー情報 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden">
                {formData.thumbnail_image_url ? (
                  <img
                    src={formData.thumbnail_image_url || "/placeholder.svg"}
                    alt={formData.thumbnail_alt || formData.deck_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=80&width=128"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{formData.deck_name || "デッキ名未設定"}</h1>
                  {formData.deck_badge && <Badge variant="secondary">{formData.deck_badge}</Badge>}
                  <Badge variant="outline">{formData.tier_rank}ランク</Badge>
                </div>
                <p className="text-gray-600 mb-3">{formData.deck_description || "説明未設定"}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>0 views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>0 likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>0 comments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>0.0/5 (0件)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="flex gap-2 border-b">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              onClick={() => setActiveTab("overview")}
              size="sm"
            >
              概要
            </Button>
            <Button
              variant={activeTab === "cards" ? "default" : "ghost"}
              onClick={() => setActiveTab("cards")}
              size="sm"
            >
              カード構成
            </Button>
            <Button
              variant={activeTab === "strengths" ? "default" : "ghost"}
              onClick={() => setActiveTab("strengths")}
              size="sm"
            >
              強み・弱み
            </Button>
            <Button
              variant={activeTab === "strategy" ? "default" : "ghost"}
              onClick={() => setActiveTab("strategy")}
              size="sm"
            >
              プレイ方法
            </Button>
          </div>

          {/* タブコンテンツ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 評価セクション */}
              <Card>
                <CardHeader>
                  <CardTitle>{formData.evaluation_title || "デッキ評価"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">ティア情報</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>ランク:</span>
                          <Badge variant="outline">{formData.tier_rank}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>ティア名:</span>
                          <span>{formData.tier_name || "Tier1"}</span>
                        </div>
                      </div>
                      {formData.tier_descriptions && formData.tier_descriptions.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium mb-2">特徴:</h5>
                          <ul className="text-sm space-y-1">
                            {formData.tier_descriptions
                              .filter((desc: string) => desc.trim())
                              .map((desc: string, index: number) => (
                                <li key={index} className="text-gray-600">
                                  • {desc}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">ステータス</h4>
                      <div className="space-y-3">
                        {Object.entries(formData.stats).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{getStatLabel(key)}</span>
                              <span>{value}/5</span>
                            </div>
                            <Progress value={(value as number) * 20} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 簡易リスト */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>強み・弱み (簡易)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {formData.strengths_weaknesses_list
                        .filter((item: string) => item.trim())
                        .map((item: string, index: number) => (
                          <li key={index} className="text-sm">
                            • {item}
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>プレイ方法 (簡易)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {formData.how_to_play_list
                        .filter((item: string) => item.trim())
                        .map((item: string, index: number) => (
                          <li key={index} className="text-sm">
                            • {item}
                          </li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "cards" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  カード構成
                  <Badge variant={totalCards > 20 ? "destructive" : "outline"}>{totalCards}/20枚</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {deckCards.map((card, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden">
                        <CardDisplay cardId={card.card_id} useThumb fill objectFit="cover" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{card.card_name}</div>
                        <div className="text-sm text-gray-600">{card.pack_name}</div>
                        <div className="text-xs text-gray-500">ID: {card.card_id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{card.card_count}枚</div>
                        <div className="text-xs text-gray-500">順序: {card.display_order}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalCards > 20 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">⚠️ デッキの枚数が20枚を超えています。</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "strengths" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{formData.section2_title || "強み・弱み"}</h3>
              {strengthsWeaknesses.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{item.description}</p>
                    {item.image_urls && item.image_urls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {item.image_urls.map((url: string, imgIndex: number) => (
                          <img
                            key={imgIndex}
                            src={url || "/placeholder.svg"}
                            alt=""
                            className="w-16 h-20 object-cover rounded border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "strategy" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{formData.section3_title || "プレイ方法"}</h3>
              {playSteps.map((step, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      STEP {step.step_number}: {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{step.description}</p>
                    {step.image_urls && step.image_urls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {step.image_urls.map((url: string, imgIndex: number) => (
                          <img
                            key={imgIndex}
                            src={url || "/placeholder.svg"}
                            alt=""
                            className="w-16 h-20 object-cover rounded border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
