import { ImageResponse } from "next/og"
import { getTradePostDetailsById } from "@/lib/actions/trade-actions"

// Edge Runtime で実行（高速化）
export const runtime = "edge"

// 画像サイズ（Twitter Card推奨）
export const size = {
  width: 1200,
  height: 630,
}

// Content-Type
export const contentType = "image/png"

// Alt text
export const alt = "PokeLink トレード投稿"

/**
 * 画像をData URL（Base64エンコード）に変換
 * @param imageUrl 元の画像URL
 * @returns Data URL
 */
async function convertImageToDataUrl(imageUrl: string): Promise<string | null> {
  try {
    console.log("Fetching image:", imageUrl)

    // タイムアウト設定
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒でタイムアウト

    const response = await fetch(imageUrl, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      console.error("Failed to fetch image:", response.status, response.statusText)
      return null
    }

    // ArrayBufferとして取得
    const arrayBuffer = await response.arrayBuffer()
    console.log("Received image buffer, size:", arrayBuffer.byteLength)

    // Base64エンコード
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")

    // Content-Typeを取得（デフォルトはimage/png）
    const contentType = response.headers.get("content-type") || "image/png"

    // Data URLを生成
    const dataUrl = `data:${contentType};base64,${base64}`
    console.log("Generated data URL, length:", dataUrl.length)

    return dataUrl
  } catch (error) {
    console.error("Error converting image to data URL:", error)
    return null
  }
}

/**
 * WEBP画像をData URL（Base64エンコード）に変換
 * @param imageUrl 元の画像URL
 * @returns Data URL（WEBP以外はそのまま、WEBPは変換してBase64化）
 */
async function convertWebpToDataUrl(imageUrl: string | null | undefined): Promise<string | null> {
  // imageUrlがない場合はnullを返す
  if (!imageUrl) {
    console.log("No image URL provided")
    return null
  }

  try {
    // URLをパースして拡張子をチェック
    const url = new URL(imageUrl)
    const pathname = url.pathname.toLowerCase()

    // WEBP形式でない場合はそのままData URLに変換
    if (!pathname.endsWith(".webp")) {
      console.log("Not a WEBP image, converting directly:", imageUrl)
      return await convertImageToDataUrl(imageUrl)
    }

    // 変換APIのURLを生成
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"
    const apiUrl = new URL("/api/convert-webp-to-png", baseUrl)
    apiUrl.searchParams.set("url", imageUrl)

    console.log("Fetching converted image from API:", apiUrl.href)

    // 変換APIを呼び出してData URLに変換
    return await convertImageToDataUrl(apiUrl.href)
  } catch (error) {
    console.error("Error converting WEBP to data URL:", error)
    return null
  }
}

export default async function Image({ params }: { params: { id: string } }) {
  try {
    console.log("=== Starting OG image generation for trade:", params.id)

    // 投稿データを取得
    const result = await getTradePostDetailsById(params.id)

    if (!result.success || !result.post) {
      console.log("Failed to get trade post data")
      // データ取得失敗時: シンプルなフォールバック画像
      return new ImageResponse(
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
            color: "white",
            fontSize: 60,
            fontWeight: "bold",
          }}
        >
          PokeLink
        </div>,
        { ...size },
      )
    }

    const post = result.post

    // カード画像URLを取得（最初の1枚ずつ）
    const wantedCardImageUrl = post.wantedCards?.[0]?.imageUrl
    const offeredCardImageUrl = post.offeredCards?.[0]?.imageUrl

    console.log("Wanted card URL:", wantedCardImageUrl || "null")
    console.log("Offered card URL:", offeredCardImageUrl || "null")

    // ベース画像のURLを生成（linkpreview_images.pngを使用）
    const baseImageUrl = new URL(
      "/linkpreview_images.png",
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com",
    ).href

    console.log("Base image URL:", baseImageUrl)

    // プレースホルダー画像のURLを生成
    const placeholderImageUrl = new URL(
      "/no-card-placeholder.png",
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com",
    ).href

    console.log("Placeholder image URL:", placeholderImageUrl)

    // ベース画像をData URLに変換
    const baseImageDataUrl = await convertImageToDataUrl(baseImageUrl)
    if (!baseImageDataUrl) {
      console.error("Failed to convert base image to data URL")
      // ベース画像の変換に失敗した場合はフォールバック
      return new ImageResponse(
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
            color: "white",
            fontSize: 60,
            fontWeight: "bold",
          }}
        >
          PokeLink
        </div>,
        { ...size },
      )
    }

    // プレースホルダー画像をData URLに変換
    const placeholderDataUrl = await convertImageToDataUrl(placeholderImageUrl)
    if (!placeholderDataUrl) {
      console.error("Failed to convert placeholder image to data URL")
    }

    // カード画像をData URLに変換（非同期処理）
    let wantedCardImage: string | null = null
    let offeredCardImage: string | null = null

    // 求めるカードの変換
    if (wantedCardImageUrl) {
      try {
        console.log("Converting wanted card image...")
        wantedCardImage = await convertWebpToDataUrl(wantedCardImageUrl)
        console.log("Wanted card result:", wantedCardImage ? `Data URL (length: ${wantedCardImage.length})` : "null")
      } catch (error) {
        console.error("Error converting wanted card:", error)
        wantedCardImage = null
      }
    } else {
      console.log("No wanted card image URL provided")
    }

    // 譲れるカードの変換
    if (offeredCardImageUrl) {
      try {
        console.log("Converting offered card image...")
        offeredCardImage = await convertWebpToDataUrl(offeredCardImageUrl)
        console.log("Offered card result:", offeredCardImage ? `Data URL (length: ${offeredCardImage.length})` : "null")
      } catch (error) {
        console.error("Error converting offered card:", error)
        offeredCardImage = null
      }
    } else {
      console.log("No offered card image URL provided")
    }

    // 最終的な画像URLを決定（プレースホルダーを優先的に使用）
    const finalWantedCardImage = wantedCardImage || placeholderDataUrl || placeholderImageUrl
    const finalOfferedCardImage = offeredCardImage || placeholderDataUrl || placeholderImageUrl

    console.log("=== Rendering ImageResponse")
    console.log("Final wanted card image:", finalWantedCardImage ? "Available" : "null")
    console.log("Final offered card image:", finalOfferedCardImage ? "Available" : "null")

    return new ImageResponse(
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
        }}
      >
        {/* ベース画像 */}
        <img
          src={baseImageDataUrl || "/placeholder.svg"}
          alt="Base"
          width={1200}
          height={630}
          style={{
            position: "absolute",
            width: "1200px",
            height: "630px",
          }}
        />

        {/* 求めるカード（左側・青枠） */}
        <img
          src={finalWantedCardImage || "/placeholder.svg"}
          alt="Wanted Card"
          width={315}
          height={440}
          style={{
            position: "absolute",
            left: "135px",
            top: "132px",
            width: "280px",
            height: "389px",
            objectFit: "contain",
          }}
        />

        {/* 譲れるカード（右側・緑枠） */}
        <img
          src={finalOfferedCardImage || "/placeholder.svg"}
          alt="Offered Card"
          width={315}
          height={440}
          style={{
            position: "absolute",
            left: "830px",
            top: "133px",
            width: "285px",
            height: "388px",
            objectFit: "contain",
          }}
        />
      </div>,
      {
        ...size,
      },
    )
  } catch (error) {
    console.error("=== Critical error generating OG image:", error)

    // エラー時: フォールバック画像
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
          color: "white",
          fontSize: 60,
          fontWeight: "bold",
        }}
      >
        PokeLink
      </div>,
      { ...size },
    )
  }
}
