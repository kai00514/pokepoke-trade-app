"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StrengthWeaknessDetail {
  title: string
  description: string
  image_urls: string[]
}

interface StrengthsWeaknessesProps {
  strengths: StrengthWeaknessDetail[]
  weaknesses: StrengthWeaknessDetail[]
}

export function StrengthsWeaknesses({ strengths, weaknesses }: StrengthsWeaknessesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const renderSection = (items: StrengthWeaknessDetail[], title: string, bgColor: string) => (
    <Card className="mb-4">
      <CardHeader className="py-2">
        <CardTitle className={`text-base ${bgColor} text-white p-2 rounded`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {items.map((item, index) => (
          <div key={index} className="mb-4 last:mb-0">
            <h4 className="font-semibold text-sm mb-2">{item.title}</h4>
            <p className="text-sm text-gray-600 mb-3" dangerouslySetInnerHTML={{ __html: item.description }} />
            {item.image_urls && item.image_urls.length > 0 && (
              <div className="overflow-x-auto">
                <div className="flex gap-2" style={{ minWidth: "max-content" }}>
                  {item.image_urls.map((imageUrl, imgIndex) => (
                    <div key={imgIndex} className="flex-shrink-0">
                      <Image
                        src={imageUrl || "/placeholder.svg?height=112&width=80&query=カード"}
                        alt={`${item.title} カード ${imgIndex + 1}`}
                        width={80}
                        height={112}
                        className="w-20 h-28 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(imageUrl)}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=112&width=80"
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div>
      {strengths && strengths.length > 0 && renderSection(strengths, "強み", "bg-green-600")}
      {weaknesses && weaknesses.length > 0 && renderSection(weaknesses, "弱み", "bg-red-600")}

      {/* 画像プレビューオーバーレイ */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-full">
            <Image
              src={selectedImage || "/placeholder.svg"}
              alt="カード拡大表示"
              width={400}
              height={560}
              className="rounded-lg shadow-2xl max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
