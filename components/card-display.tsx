"use client"

import type React from "react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { fetchCardById } from "@/lib/card-api"

interface CardDisplayProps {
  cardId: number | string
  useThumb?: boolean
  width?: number
  height?: number
  className?: string
  fill?: boolean
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
}

const CardDisplay: React.FC<CardDisplayProps> = ({
  cardId,
  useThumb = true,
  width,
  height,
  className,
  fill = false,
  objectFit = "contain",
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getImageUrl = async () => {
      setLoading(true)
      setError(null)

      // cardIdが無効な場合は即座にプレースホルダーを表示
      if (!cardId) {
        setLoading(false)
        setError("カードIDがありません")
        setImageUrl(`/placeholder.svg?width=${width || 100}&height=${height || 140}&query=no-card-id`)
        return
      }

      try {
        const cardData = await fetchCardById(String(cardId))
        if (cardData) {
          const url = useThumb ? cardData.thumb_url || cardData.image_url : cardData.image_url
          if (url) {
            // URLの有効性を簡単にチェック
            if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
              setImageUrl(url)
            } else {
              throw new Error("Invalid image URL format")
            }
          } else {
            setError("画像が見つかりません")
            setImageUrl(`/placeholder.svg?width=${width || 100}&height=${height || 140}&query=card-${cardId}`)
          }
        } else {
          setError("カードデータが見つかりません")
          setImageUrl(`/placeholder.svg?width=${width || 100}&height=${height || 140}&query=card-${cardId}-nodata`)
        }
      } catch (err) {
        console.error(`Error fetching image for card ${cardId}:`, err)
        setError("画像の読み込みに失敗しました")
        setImageUrl(`/placeholder.svg?width=${width || 100}&height=${height || 140}&query=card-${cardId}-error`)
      } finally {
        setLoading(false)
      }
    }

    getImageUrl()
  }, [cardId, useThumb, width, height])

  // ローディング状態
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 rounded-md animate-pulse ${className || ""}`}
        style={fill ? { width: "100%", height: "100%" } : { width: `${width || 100}px`, height: `${height || 140}px` }}
      >
        <div className="text-xs text-gray-500">読み込み中...</div>
      </div>
    )
  }

  // エラー状態またはimageUrlが無い場合
  if (error || !imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-300 rounded-md text-gray-600 text-xs p-2 ${className || ""}`}
        style={fill ? { width: "100%", height: "100%" } : { width: `${width || 100}px`, height: `${height || 140}px` }}
      >
        <div className="text-center">
          <div className="mb-1">📷</div>
          <div>{error || "画像なし"}</div>
        </div>
      </div>
    )
  }

  // 画像の表示（fill使用時）
  if (fill) {
    return (
      <div className={`relative w-full h-full ${className || ""}`}>
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={`Card ${cardId}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-${objectFit} rounded-md`}
          priority={false}
          unoptimized={true} // 外部画像の問題を回避するため常にunoptimizedを使用
          onError={(e) => {
            console.error(`Image load error for card ${cardId}:`, e)
            // エラー時にプレースホルダーに切り替え
            const target = e.target as HTMLImageElement
            target.src = `/placeholder.svg?width=${width || 100}&height=${height || 140}&query=card-${cardId}-load-error`
          }}
        />
      </div>
    )
  }

  // 画像の表示（通常サイズ指定）
  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt={`Card ${cardId}`}
      width={width || 100}
      height={height || 140}
      className={`rounded-md ${className || ""}`}
      priority={false}
      unoptimized={true} // 外部画像の問題を回避するため常にunoptimizedを使用
      onError={(e) => {
        console.error(`Image load error for card ${cardId}:`, e)
        // エラー時にプレースホルダーに切り替え
        const target = e.target as HTMLImageElement
        target.src = `/placeholder.svg?width=${width || 100}&height=${height || 140}&query=card-${cardId}-load-error`
      }}
    />
  )
}

export default CardDisplay
