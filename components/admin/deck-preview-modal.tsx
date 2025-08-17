"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
          <DialogTitle>デッキプレビュー</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{formData.title || "デッキタイトル"}</CardTitle>
                  <p className="text-gray-600 mt-2">{formData.deck_description || "デッキ説明"}</p>
                </div>
                <div className="flex gap-2">
                  {formData.deck_badge && <Badge variant="secondary">{formData.deck_badge}</Badge>}
                  <Badge variant={formData.is_published ? "default" : "outline"}>
                    {formData.is_published ? "公開" : "下書き"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">デッキ名</p>
                  <p className="font-medium">{formData.deck_name || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">エネルギータイプ</p>
                  <p className="font-medium">{formData.energy_type || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ティアランク</p>
                  <p className="font-medium">{formData.tier_rank}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">カテゴリー</p>
                  <p className="font-medium">{formData.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* カード構成 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                カード構成
                <Badge variant={totalCards > 20 ? "destructive" : "default"}>{totalCards}/20枚</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {deckCards.map((card) => (
                  <div key={card.id} className="text-center">
                    <div className="w-full h-24 bg-gray-200 rounded mb-2 overflow-hidden">
                      <CardDisplay cardId={card.card_id} useThumb fill objectFit="cover" />
                    </div>
                    <p className="text-xs font-medium truncate">{card.card_name}</p>
                    <p className="text-xs text-gray-600">×{card.card_count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ステータス評価 */}
          <Card>
            <CardHeader>
              <CardTitle>ステータス評価</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{labels[key as keyof typeof labels]}</span>
                        <span className="text-sm text-gray-600">{value}/5</span>
                      </div>
                      <Progress value={(value as number) * 20} className="h-2" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 強み・弱み */}
          {strengthsWeaknesses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>強み・弱み</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strengthsWeaknesses.map((item, index) => (
                    <div key={item.id} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      {item.image_urls.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {item.image_urls.slice(0, 3).map((url: string, imgIndex: number) => (
                            <img
                              key={imgIndex}
                              src={url || "/placeholder.svg"}
                              alt=""
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg"
                              }}
                            />
                          ))}
                          {item.image_urls.length > 3 && (
                            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs">
                              +{item.image_urls.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* プレイ方法 */}
          {playSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>プレイ方法</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playSteps.map((step, index) => (
                    <div key={step.id} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {step.step_number}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        {step.image_urls.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {step.image_urls.slice(0, 3).map((url: string, imgIndex: number) => (
                              <img
                                key={imgIndex}
                                src={url || "/placeholder.svg"}
                                alt=""
                                className="w-12 h-12 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg"
                                }}
                              />
                            ))}
                            {step.image_urls.length > 3 && (
                              <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs">
                                +{step.image_urls.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ティア説明 */}
          {formData.tier_descriptions.length > 0 && formData.tier_descriptions[0] && (
            <Card>
              <CardHeader>
                <CardTitle>ティア説明</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {formData.tier_descriptions
                    .filter((desc: string) => desc.trim())
                    .map((description: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {description}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
