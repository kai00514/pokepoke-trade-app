"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface StrengthsWeaknessesProps {
  strengthsWeaknessesList: string[]
  strengthsWeaknessesDetails: Array<{
    title: string
    description: string
    image_urls?: string[]
  }>
}

export function StrengthsWeaknesses({ strengthsWeaknessesList, strengthsWeaknessesDetails }: StrengthsWeaknessesProps) {
  return (
    <div className="space-y-6">
      {/* 概要リスト */}
      {strengthsWeaknessesList && strengthsWeaknessesList.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 text-blue-600 border-l-4 border-blue-500 pl-3">概要</h4>
          <ul className="space-y-2">
            {strengthsWeaknessesList.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 詳細セクション */}
      {strengthsWeaknessesDetails && strengthsWeaknessesDetails.length > 0 && (
        <div className="space-y-4">
          {strengthsWeaknessesDetails.map((detail, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <h5 className="font-medium text-gray-900 mb-3">{detail.title}</h5>
                <p className="text-gray-700 mb-4 leading-relaxed">{detail.description}</p>

                {/* 画像がある場合の横スクロール表示 */}
                {detail.image_urls && detail.image_urls.length > 0 && (
                  <div className="overflow-x-auto">
                    <div className="flex gap-3 pb-2" style={{ minWidth: "max-content" }}>
                      {detail.image_urls.map((imageUrl, imgIndex) => (
                        <div key={imgIndex} className="flex-shrink-0">
                          <Image
                            src={imageUrl || "/placeholder.svg?height=200&width=140&query=ポケモンカード"}
                            alt={`${detail.title} 関連カード ${imgIndex + 1}`}
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
