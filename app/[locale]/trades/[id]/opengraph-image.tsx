import { ImageResponse } from "next/og"
import { getTradePostDetailsById } from "@/lib/actions/trade-actions"

// Node.js Runtime で実行（Google Cloud Translation API互換性のため）
export const runtime = "nodejs"

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
 * @param label ログ用のラベル
 * @returns Data URL
 */
async function convertImageToDataUrl(imageUrl: string, label = "image"): Promise<string | null> {
  const startTime = Date.now()
  try {
    console.log(`[${label}] Fetching image:`, imageUrl)

    // タイムアウト設定
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒でタイムアウト

    const fetchStartTime = Date.now()
    const response = await fetch(imageUrl, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    const fetchDuration = Date.now() - fetchStartTime
    console.log(`[${label}] Fetch completed in ${fetchDuration}ms`)

    if (!response.ok) {
      console.error(`[${label}] Failed to fetch image:`, response.status, response.statusText)
      return null
    }

    // ArrayBufferとして取得
    const arrayBufferStartTime = Date.now()
    const arrayBuffer = await response.arrayBuffer()
    const arrayBufferDuration = Date.now() - arrayBufferStartTime
    console.log(`[${label}] Received image buffer, size: ${arrayBuffer.byteLength} bytes (${arrayBufferDuration}ms)`)

    // Base64エンコード
    const encodeStartTime = Date.now()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const encodeDuration = Date.now() - encodeStartTime
    console.log(`[${label}] Base64 encoding completed in ${encodeDuration}ms`)

    // Content-Typeを取得（デフォルトはimage/png）
    const contentType = response.headers.get("content-type") || "image/png"

    // Data URLを生成
    const dataUrl = `data:${contentType};base64,${base64}`

    const totalDuration = Date.now() - startTime
    console.log(`[${label}] Generated data URL, length: ${dataUrl.length} characters (total: ${totalDuration}ms)`)

    return dataUrl
  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error(`[${label}] Error converting image to data URL (${totalDuration}ms):`, error)
    return null
  }
}

/**
 * WEBP画像をData URL（Base64エンコード）に変換
 * @param imageUrl 元の画像URL
 * @param label ログ用のラベル
 * @returns Data URL（WEBP以外はそのまま、WEBPは変換してBase64化）
 */
async function convertWebpToDataUrl(imageUrl: string | null | undefined, label = "card"): Promise<string | null> {
  // imageUrlがない場合はnullを返す
  if (!imageUrl) {
    console.log(`[${label}] No image URL provided`)
    return null
  }

  try {
    // URLをパースして拡張子をチェック
    const url = new URL(imageUrl)
    const pathname = url.pathname.toLowerCase()

    // WEBP形式でない場合はそのままData URLに変換
    if (!pathname.endsWith(".webp")) {
      console.log(`[${label}] Not a WEBP image, converting directly:`, imageUrl)
      return await convertImageToDataUrl(imageUrl, label)
    }

    // 変換APIのURLを生成
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"
    const apiUrl = new URL("/api/convert-webp-to-png", baseUrl)
    apiUrl.searchParams.set("url", imageUrl)

    console.log(`[${label}] Fetching converted image from API:`, apiUrl.href)

    // 変換APIを呼び出してData URLに変換
    return await convertImageToDataUrl(apiUrl.href, label)
  } catch (error) {
    console.error(`[${label}] Error converting WEBP to data URL:`, error)
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const overallStartTime = Date.now()
  const { id, locale } = await params

  try {
    console.log("=== Starting OG image generation for trade:", id)

    // 投稿データを取得
    const dataFetchStart = Date.now()
    const result = await getTradePostDetailsById(id, locale)
    const dataFetchDuration = Date.now() - dataFetchStart
    console.log(`Data fetch completed in ${dataFetchDuration}ms`)

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

    // === 並列処理: すべての画像を同時に変換 ===
    console.log("=== Starting parallel image conversion ===")
    const parallelStartTime = Date.now()

    const [baseImageDataUrl, placeholderDataUrl, wantedCardImage, offeredCardImage] = await Promise.all([
      convertImageToDataUrl(baseImageUrl, "base-image"),
      convertImageToDataUrl(placeholderImageUrl, "placeholder"),
      wantedCardImageUrl ? convertWebpToDataUrl(wantedCardImageUrl, "wanted-card") : Promise.resolve(null),
      offeredCardImageUrl ? convertWebpToDataUrl(offeredCardImageUrl, "offered-card") : Promise.resolve(null),
    ])

    const parallelDuration = Date.now() - parallelStartTime
    console.log(`=== Parallel conversion completed in ${parallelDuration}ms ===`)

    // ベース画像のチェック
    if (!baseImageDataUrl) {
      console.error("Failed to convert base image to data URL")
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

    // プレースホルダー画像の確認
    if (!placeholderDataUrl) {
      console.error("Failed to convert placeholder image to data URL")
    }

    // 最終的な画像URLを決定（プレースホルダーを優先的に使用）
    const finalWantedCardImage = wantedCardImage || placeholderDataUrl || placeholderImageUrl
    const finalOfferedCardImage = offeredCardImage || placeholderDataUrl || placeholderImageUrl

    console.log("=== Final image status ===")
    console.log(
      "Wanted card image:",
      wantedCardImage ? `Available (${wantedCardImage.length} chars)` : "null -> using placeholder",
    )
    console.log(
      "Offered card image:",
      offeredCardImage ? `Available (${offeredCardImage.length} chars)` : "null -> using placeholder",
    )
    console.log(
      "Final wanted card image:",
      finalWantedCardImage ? `Available (${finalWantedCardImage.length} chars)` : "null",
    )
    console.log(
      "Final offered card image:",
      finalOfferedCardImage ? `Available (${finalOfferedCardImage.length} chars)` : "null",
    )

    // ImageResponse生成の開始時間を記録
    const renderStartTime = Date.now()
    console.log("=== Rendering ImageResponse ===")

    const imageResponse = new ImageResponse(
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

    const renderDuration = Date.now() - renderStartTime
    const overallDuration = Date.now() - overallStartTime
    console.log(`ImageResponse rendering completed in ${renderDuration}ms`)
    console.log(`=== Total OG image generation time: ${overallDuration}ms ===`)

    return imageResponse
  } catch (error) {
    const overallDuration = Date.now() - overallStartTime
    console.error(`=== Critical error generating OG image (${overallDuration}ms):`, error)

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
