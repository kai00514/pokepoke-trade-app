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
 * WEBP画像URLを変換APIのURLに変換
 * @param imageUrl 元の画像URL
 * @returns 変換API経由のURL（WEBP以外はそのまま、WEBPは変換APIを通す）
 */
function convertWebpImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null

  try {
    // URLをパースして拡張子をチェック
    const url = new URL(imageUrl)
    const pathname = url.pathname.toLowerCase()

    // WEBP形式かチェック（pathnameには ? や # が含まれない）
    if (!pathname.endsWith(".webp")) {
      return imageUrl
    }

    // 変換APIのURLを生成（絶対URLが必要）
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"
    const apiUrl = new URL("/api/convert-webp-to-png", baseUrl)
    apiUrl.searchParams.set("url", imageUrl)

    return apiUrl.href
  } catch {
    // URLパースに失敗した場合は元のURLをそのまま返す
    return imageUrl
  }
}

export default async function Image({ params }: { params: { id: string } }) {
  try {
    // 投稿データを取得
    const result = await getTradePostDetailsById(params.id)

    if (!result.success || !result.post) {
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
    const wantedCardImageUrl = post.wantedCards[0]?.imageUrl
    const offeredCardImageUrl = post.offeredCards[0]?.imageUrl

    // WEBP画像を変換APIのURLに変換
    const wantedCardImage = convertWebpImageUrl(wantedCardImageUrl)
    const offeredCardImage = convertWebpImageUrl(offeredCardImageUrl)

    // ベース画像のURLを生成（linkpreview_images.pngを使用）
    const baseImageUrl = new URL(
      "/linkpreview_images.png",
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com",
    ).href

    console.log("Generating OG image for trade:", params.id)
    console.log("Wanted card image:", wantedCardImage)
    console.log("Offered card image:", offeredCardImage)

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
        {wantedCardImage && (
          <img
            src={wantedCardImage || "/placeholder.svg"}
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
        )}

        {/* 譲れるカード（右側・緑枠） */}
        {offeredCardImage && (
          <img
            src={offeredCardImage || "/placeholder.svg"}
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
        )}
      </div>,
      {
        ...size,
      },
    )
  } catch (error) {
    console.error("Error generating OG image:", error)

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
