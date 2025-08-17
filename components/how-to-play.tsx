"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface HowToPlayProps {
  howToPlayList: string[]
  howToPlaySteps: Array<{
    step: number
    title: string
    description: string
    image_urls?: string[]
  }>
}

export function HowToPlay({ howToPlayList, howToPlaySteps }: HowToPlayProps) {
  return (
    <div className="space-y-6">
      {/* 概要リスト */}
      {howToPlayList && howToPlayList.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 text-blue-600 border-l-4 border-blue-500 pl-3">基本戦略</h4>
          <ul className="space-y-2">
            {howToPlayList.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ステップ詳細 */}
      {howToPlaySteps && howToPlaySteps.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold mb-3 text-blue-600 border-l-4 border-blue-500 pl-3">詳細手順</h4>
          {howToPlaySteps.map((step, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <h5 className="font-medium text-gray-900">{step.title}</h5>
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">{step.description}</p>

                {/* 画像がある場合の横スクロール表示 */}
                {step.image_urls && step.image_urls.length > 0 && (
                  <div className="overflow-x-auto">
                    <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
                      {step.image_urls.map((imageUrl, imgIndex) => (
                        <div key={imgIndex} className="flex-shrink-0">
                          <Image
                            src={imageUrl || "/placeholder.svg?height=200&width=140&query=ポケモンカード"}
                            alt={`${step.title} 関連カード ${imgIndex + 1}`}
                            width={140}
                            height={200}
                            className="rounded border border-gray-200 object-cover shadow-sm"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg?height=200&width=140"
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
