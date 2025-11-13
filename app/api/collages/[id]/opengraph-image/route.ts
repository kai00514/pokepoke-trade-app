import { ImageResponse } from "next/og"
import { getCollageById } from "@/lib/actions/collages"
import { calculateGridLayout, calculateUniformSpacing, calculateCardPositions } from "@/lib/collage-generator"

export const runtime = "edge"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

/**
 * Replace placeholder with full OG image generation implementation
 * Converts remote image URLs to Data URLs for embedding in ImageResponse
 */
async function convertImageToDataUrl(imageUrl: string | null, label = "card"): Promise<string | null> {
  if (!imageUrl) return null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(imageUrl, { signal: controller.signal }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const contentType = response.headers.get("content-type") || "image/png"

    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error(`[${label}] Error:`, error)
    return null
  }
}

/**
 * Fetch background image from public path
 */
async function getBackgroundImage(): Promise<string | null> {
  const bgUrl = new URL("/coragu_backimage.png", process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com").href
  return convertImageToDataUrl(bgUrl, "background")
}

export default async function Image({ params }: { params: { id: string } }) {
  try {
    console.log("=== Starting collage OG image generation for:", params.id)

    // Fetch collage data
    const result = await getCollageById(params.id)

    if (!result.success || !result.collage) {
      console.log("Failed to get collage data")
      return new ImageResponse(
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to right, #EC4899, #6366F1)",
            color: "white",
            fontSize: 48,
            fontWeight: "bold",
          }}
        >
          PokeLink
        </div>,
        { ...size },
      )
    }

    const collage = result.collage

    // Fetch background image
    const backgroundImageData = await getBackgroundImage()
    if (!backgroundImageData) {
      console.error("Failed to fetch background image")
      return new ImageResponse(
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to right, #EC4899, #6366F1)",
            color: "white",
            fontSize: 48,
            fontWeight: "bold",
          }}
        >
          PokeLink
        </div>,
        { ...size },
      )
    }

    // Fetch all card images in parallel
    console.log("[OG] Fetching card images...")
    const [images1, images2] = await Promise.all([
      Promise.all(collage.cards1.map((card) => convertImageToDataUrl(card.imageUrl, `card-${card.id}`))),
      Promise.all(collage.cards2.map((card) => convertImageToDataUrl(card.imageUrl, `card-${card.id}`))),
    ])

    console.log(`[OG] Fetched: ${images1.length} images for group 1, ${images2.length} images for group 2`)

    // Calculate layouts and spacing
    const layout1 = calculateGridLayout(collage.cards1.length)
    const layout2 = calculateGridLayout(collage.cards2.length)
    const spacing = calculateUniformSpacing(collage.cards1.length, collage.cards2.length)

    const positions1 = calculateCardPositions(layout1, 60, spacing.zone2Y)
    const positions2 = calculateCardPositions(layout2, 60, spacing.zone4Y)

    console.log("[OG] Layout calculated - Zone1Y:", spacing.zone1Y, "Zone3Y:", spacing.zone3Y)

    // Scale factor from 1536x1024 to 1200x630
    const scaleFactorX = 1200 / 1536
    const scaleFactorY = 630 / 1024

    // Generate OG image (1200x630)
    const imageResponse = new ImageResponse(
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background scaled */}
        <img
          src={backgroundImageData || "/placeholder.svg"}
          alt="Background"
          width={1536}
          height={1024}
          style={{
            position: "absolute",
            width: "1536px",
            height: "1024px",
            transform: `scale(${scaleFactorX}, ${scaleFactorY})`,
            transformOrigin: "top left",
            objectFit: "cover",
          }}
        />

        {/* Title 1 */}
        <div
          style={{
            position: "absolute",
            left: `${60 * scaleFactorX}px`,
            top: `${spacing.zone1Y * scaleFactorY}px`,
            fontSize: "24px",
            fontWeight: "bold",
            color: "#FFFFFF",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            maxWidth: "900px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {collage.title1}
        </div>

        {/* Cards Group 1 */}
        {collage.cards1.map((card, index) => {
          const pos = positions1[index]
          const imgUrl = images1[index]
          if (!imgUrl || !pos) return null

          return (
            <img
              key={`card1-${index}`}
              src={imgUrl || "/placeholder.svg"}
              alt={card.name}
              style={{
                position: "absolute",
                left: `${pos.x * scaleFactorX}px`,
                top: `${pos.y * scaleFactorY}px`,
                width: `${layout1.cardSize * scaleFactorX}px`,
                height: `${layout1.cardSize * scaleFactorY}px`,
                objectFit: "cover",
                borderRadius: "2px",
              }}
            />
          )
        })}

        {/* Title 2 */}
        <div
          style={{
            position: "absolute",
            left: `${60 * scaleFactorX}px`,
            top: `${spacing.zone3Y * scaleFactorY}px`,
            fontSize: "24px",
            fontWeight: "bold",
            color: "#FFFFFF",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            maxWidth: "900px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {collage.title2}
        </div>

        {/* Cards Group 2 */}
        {collage.cards2.map((card, index) => {
          const pos = positions2[index]
          const imgUrl = images2[index]
          if (!imgUrl || !pos) return null

          return (
            <img
              key={`card2-${index}`}
              src={imgUrl || "/placeholder.svg"}
              alt={card.name}
              style={{
                position: "absolute",
                left: `${pos.x * scaleFactorX}px`,
                top: `${pos.y * scaleFactorY}px`,
                width: `${layout2.cardSize * scaleFactorX}px`,
                height: `${layout2.cardSize * scaleFactorY}px`,
                objectFit: "cover",
                borderRadius: "2px",
              }}
            />
          )
        })}
      </div>,
      { ...size },
    )

    console.log("=== OG image generation completed successfully")

    return imageResponse
  } catch (error) {
    console.error("=== Critical error generating OG image:", error)

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to right, #EC4899, #6366F1)",
          color: "white",
          fontSize: 48,
          fontWeight: "bold",
        }}
      >
        PokeLink
      </div>,
      { ...size },
    )
  }
}
