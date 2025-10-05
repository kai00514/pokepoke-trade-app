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

    // WEBP形式でない場合はそのまま返す
    if (!pathname.endsWith(".webp")) {
      console.log("Not a WEBP image, returning original URL:", imageUrl)
      return imageUrl
    }

    // 変換APIのURLを生成
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"
    const apiUrl = new URL("/api/convert-webp-to-png", baseUrl)
    apiUrl.searchParams.set("url", imageUrl)

    console.log("Fetching converted image from API:", apiUrl.href)

    // 変換APIを呼び出し（タイムアウト設定）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒でタイムアウト

    const response = await fetch(apiUrl.href, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      console.error("Failed to convert image:", response.status, response.statusText)
      return null
    }

    // ArrayBufferとして取得
    const arrayBuffer = await response.arrayBuffer()
    console.log("Received image buffer, size:", arrayBuffer.byteLength)

    // Base64エンコード
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")

    // Data URLを生成
    const dataUrl = `data:image/png;base64,${base64}`
    console.log("Generated data URL, length:", dataUrl.length)

    return dataUrl
  } catch (error) {
    console.error("Error converting to data URL:", error)
    // エラーが発生してもnullを返す（プレースホルダーが使われる）
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

    // プレースホルダー画像のURLを生成（PNG形式）
    const placeholderImageUrl = new URL(
      "/no-card-placeholder.jpg",
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com",
    ).href

    console.log("Placeholder image URL:", placeholderImageUrl)

    // WEBP画像をData URLに変換（非同期処理）
    // エラーが発生してもnullが返るだけで、全体は失敗しない
    let wantedCardImage: string | null = null
    let offeredCardImage: string | null = null

    try {
      console.log("Converting wanted card image...")
      wantedCardImage = await convertWebpToDataUrl(wantedCardImageUrl)
      console.log("Wanted card result:", wantedCardImage ? `Data URL (length: ${wantedCardImage.length})` : "null")
    } catch (error) {
      console.error("Error converting wanted card:", error)
      wantedCardImage = null
    }

    try {
      console.log("Converting offered card image...")
      offeredCardImage = await convertWebpToDataUrl(offeredCardImageUrl)
      console.log("Offered card result:", offeredCardImage ? `Data URL (length: ${offeredCardImage.length})` : "null")
    } catch (error) {
      console.error("Error converting offered card:", error)
      offeredCardImage = null
    }

    console.log("=== Rendering ImageResponse")

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
          src={baseImageUrl || "/placeholder.svg"}
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
          src={wantedCardImage || placeholderImageUrl}
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
          src={offeredCardImage || placeholderImageUrl}
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
