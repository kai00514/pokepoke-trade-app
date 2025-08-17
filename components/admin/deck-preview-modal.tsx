"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { X } from "lucide-react"
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
  const totalCards = deckCards.reduce((sum, card) => sum + card.card_count, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            デッキプレビュー
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ヘッダー情報 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{formData.deck_name || "デッキ名未設定"}</h1>
              {formData.deck_badge && <Badge variant="secondary">{formData.deck_badge}</Badge>}
              <Badge variant={formData.is_published ? "default" : "outline"}>
                {formData.is_published ? "公開" : "下書き"}
              </Badge>
            </div>
            <p className="text-gray-600">{formData.deck_description || "デッキ説明未設定"}</p>
          </div>

          {/* デッキ構成 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {formData.section1_title || "デッキ構成"}
                <Badge variant={totalCards === 20 ? "default" : "destructive"}>{totalCards}/20枚</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {deckCards.map((card) => (
                  <div key={card.id} className="text-center">
                    <div className="w-full h-32 bg-gray-200 rounded mb-2 overflow-hidden">
                      <CardDisplay cardId={card.card_id} useThumb fill objectFit="cover" />
                    </div>
                    <div className="text-sm font-medium">{card.card_name}</div>
                    <div className="text-xs text-gray-500">×{card.card_count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 評価 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-4">
                {formData.evaluation_title || "デッキ評価"}
                <Badge variant="outline" className="text-lg px-3 py-1">
                  Tier {formData.tier_rank}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.tier_descriptions.filter((desc: string) => desc.trim()).length > 0 && (
                <div className="space-y-2">
                  {formData.tier_descriptions
                    .filter((desc: string) => desc.trim())
                    .map((description: string, index: number) => (
                      <p key={index} className="text-sm text-gray-600">
                        • {description}
                      </p>
                    ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.stats).map(([key, value]) => {
                  const labels = {
                    accessibility: "アクセス性",
                    speed: "スピード",
                    power: "パワー",
                    durability: "耐久性",
                    stability: "安定性",
                  }
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{labels[key as keyof typeof labels]}</span>
                        <span>{value}/5</span>
                      </div>
                      <Progress value={(value as number) * 20} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 強み・弱み */}
          <Card>
            <CardHeader>
              <CardTitle>{formData.section2_title || "強み・弱み"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.strengths_weaknesses_list.filter((item: string) => item.trim()).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">概要</h4>
                  {formData.strengths_weaknesses_list
                    .filter((item: string) => item.trim())
                    .map((item: string, index: number) => (
                      <p key={index} className="text-sm text-gray-600">
                        • {item}
                      </p>
                    ))}
                </div>
              )}

              {strengthsWeaknesses.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">詳細</h4>
                  {strengthsWeaknesses.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">
                        {index + 1}. {item.title}
                      </h5>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      {item.image_urls.length > 0 && (
                        <div className="flex gap-2">
                          {item.image_urls.slice(0, 3).map((url: string, imgIndex: number) => (
                            <img
                              key={imgIndex}
                              src={url || "/placeholder.svg"}
                              alt=""
                              className="w-16 h-16 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
                            />
                          ))}
                          {item.image_urls.length > 3 && (
                            <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs">
                              +{item.image_urls.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* プレイ方法 */}
          <Card>
            <CardHeader>
              <CardTitle>{formData.section3_title || "プレイ方法"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.how_to_play_list.filter((item: string) => item.trim()).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">概要</h4>
                  {formData.how_to_play_list
                    .filter((item: string) => item.trim())
                    .map((item: string, index: number) => (
                      <p key={index} className="text-sm text-gray-600">
                        • {item}
                      </p>
                    ))}
                </div>
              )}

              {playSteps.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">詳細手順</h4>
                  {playSteps.map((step) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <h5 className="font-medium mb-2">
                        STEP {step.step_number}: {step.title}
                      </h5>
                      <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      {step.image_urls.length > 0 && (
                        <div className="flex gap-2">
                          {step.image_urls.slice(0, 3).map((url: string, imgIndex: number) => (
                            <img
                              key={imgIndex}
                              src={url || "/placeholder.svg"}
                              alt=""
                              className="w-16 h-16 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
                            />
                          ))}
                          {step.image_urls.length > 3 && (
                            <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs">
                              +{step.image_urls.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
