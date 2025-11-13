import { ImageResponse } from "next/og"
import { getCollageById } from "@/lib/actions/collages"
import { calculateGridLayout, calculateUniformSpacing, calculateCardPositions } from "@/lib/collage-generator"

export const runtime = "nodejs"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export const alt = "PokeLink コラージュ画像"

async function convertImageToDataUrl(imageUrl: string | null, label = "image"): Promise<string | null> {
  if (!imageUrl) return null

  let absoluteUrl = imageUrl
  if (imageUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"
    absoluteUrl = `${baseUrl}${imageUrl}`
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15秒に延長

    const response = await fetch(absoluteUrl, { signal: controller.signal }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) return null

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

    const bgUrl = new URL("/coragu_backimage.png", process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com").href
    const bgDataUrl = await convertImageToDataUrl(bgUrl, "background")

    if (!bgDataUrl) {
      console.error("Failed to load background image, returning fallback")
      return createFallbackImage()
    }

    const cardImages1 = await Promise.all(
      collage.cards1.map((card, i) => convertImageToDataUrl(card.imageUrl, `card1-${i}`)),
    )
    const cardImages2 = await Promise.all(
      collage.cards2.map((card, i) => convertImageToDataUrl(card.imageUrl, `card2-${i}`)),
    )

    const layout1 = calculateGridLayout(collage.cards1.length)
    const layout2 = calculateGridLayout(collage.cards2.length)
    const zones = calculateUniformSpacing(collage.cards1.length, collage.cards2.length)

    const scaleX = 1200 / 1536
    const scaleY = 630 / 1024

    const positions1 = calculateCardPositions(layout1, 60, zones.zone2Y)
    const positions2 = calculateCardPositions(layout2, 60, zones.zone4Y)

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
        {/* 背景画像（1536×1024 → 1200×630にスケール） */}
        <img
          src={bgDataUrl || "/placeholder.svg"}
          alt="Background"
          width={1536}
          height={1024}
          style={{
            position: "absolute",
            width: `${1536 * scaleX}px`,
            height: `${1024 * scaleY}px`,
            objectFit: "cover",
          }}
        />

        {/* タイトル1 */}
        <div
          style={{
            position: "absolute",
            left: `${60 * scaleX}px`,
            top: `${zones.zone1Y * scaleY + 25 * scaleY}px`,
            fontSize: `${28 * scaleY}px`,
            fontWeight: "bold",
            color: "white",
          }}
        >
          {collage.title1}
        </div>

        {/* カードグループ1 */}
        {collage.cards1.map((card, index) => {
          const pos = positions1[index]
          const imgSrc = cardImages1[index]

          if (!imgSrc || !pos) return null

          return (
            <img
              key={`card1-${index}`}
              src={imgSrc || "/placeholder.svg"}
              alt={card.name}
              width={layout1.cardSize}
              height={layout1.cardSize}
              style={{
                position: "absolute",
                left: `${pos.x * scaleX}px`,
                top: `${pos.y * scaleY}px`,
                width: `${layout1.cardSize * scaleX}px`,
                height: `${layout1.cardSize * scaleY}px`,
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
          )
        })}

        {/* タイトル2 */}
        <div
          style={{
            position: "absolute",
            left: `${60 * scaleX}px`,
            top: `${zones.zone3Y * scaleY + 25 * scaleY}px`,
            fontSize: `${28 * scaleY}px`,
            fontWeight: "bold",
            color: "white",
          }}
        >
          {collage.title2}
        </div>

        {/* カードグループ2 */}
        {collage.cards2.map((card, index) => {
          const pos = positions2[index]
          const imgSrc = cardImages2[index]

          if (!imgSrc || !pos) return null

          return (
            <img
              key={`card2-${index}`}
              src={imgSrc || "/placeholder.svg"}
              alt={card.name}
              width={layout2.cardSize}
              height={layout2.cardSize}
              style={{
                position: "absolute",
                left: `${pos.x * scaleX}px`,
                top: `${pos.y * scaleY}px`,
                width: `${layout2.cardSize * scaleX}px`,
                height: `${layout2.cardSize * scaleY}px`,
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
          )
        })}
      </div>,
      { ...size },
    )
  } catch (error) {
    console.error("=== Critical error generating collage OG image:", error)
    return createFallbackImage()
  }
}
