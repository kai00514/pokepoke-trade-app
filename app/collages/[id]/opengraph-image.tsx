import { ImageResponse } from "next/og"
import { getCollageById } from "@/lib/actions/collages"

// Edge Runtimeで高速化
export const runtime = "edge"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export const alt = "PokeLink コラージュ画像"

/**
 * 画像をData URL（Base64エンコード）に変換
 */
async function convertImageToDataUrl(imageUrl: string | null, label = "image"): Promise<string | null> {
  if (!imageUrl) return null

  let absoluteUrl = imageUrl
  if (imageUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"
    absoluteUrl = `${baseUrl}${imageUrl}`
  }

  try {
    console.log(`[${label}] Fetching image:`, absoluteUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(absoluteUrl, { signal: controller.signal }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      console.error(`[${label}] Failed to fetch image:`, response.status)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const contentType = response.headers.get("content-type") || "image/png"

    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error(`[${label}] Error converting image:`, error)
    return null
  }
}

/**
 * フォールバック画像を生成
 */
function createFallbackImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6)",
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

export default async function Image({ params }: { params: { id: string } }) {
  try {
    console.log("=== Starting collage OG image generation:", params.id)

    const result = await getCollageById(params.id)

    if (!result.success || !result.collage) {
      console.log("Failed to get collage data")
      return createFallbackImage()
    }

    const collage = result.collage

    // 既に生成されているコラージュ画像URLを取得
    const collageImageUrl = collage.collage_image_url

    if (!collageImageUrl) {
      console.error("Collage image URL not found")
      return createFallbackImage()
    }

    console.log("Using existing collage image:", collageImageUrl)

    // コラージュ画像をData URLに変換
    const collageDataUrl = await convertImageToDataUrl(collageImageUrl, "collage-image")

    if (!collageDataUrl) {
      console.error("Failed to convert collage image to data URL")
      return createFallbackImage()
    }

    // 1536x1024の既存画像を1200x630にリサイズして表示
    return new ImageResponse(
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={collageDataUrl}
          alt={`${collage.title1} / ${collage.title2}`}
          width={1536}
          height={1024}
          style={{
            position: "absolute",
            width: "1200px",
            height: "789px", // 1024 * (1200/1536) = 800px、少し調整して789px
            objectFit: "cover",
            top: "-80px", // 上下を少しクロップして630pxに収める
          }}
        />
      </div>,
      { ...size },
    )
  } catch (error) {
    console.error("=== Critical error generating collage OG image:", error)
    return createFallbackImage()
  }
}
