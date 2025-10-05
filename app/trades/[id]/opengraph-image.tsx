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
    const wantedCardImage = post.wantedCards[0]?.imageUrl
    const offeredCardImage = post.offeredCards[0]?.imageUrl

    // ベース画像のURLを生成（linkpreview_images.pngを使用）
    const baseImageUrl = new URL(
      "/linkpreview_images.png",
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com",
    ).href

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
