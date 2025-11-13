import { ImageResponse } from "next/og"
import { calculateGridLayout, calculateUniformSpacing } from "@/lib/collage-generator"

interface Card {
  id: number
  name: string
  imageUrl: string
}

interface GenerateCollageImageParams {
  collageId: string
  title1: string
  title2: string
  cards1: Card[]
  cards2: Card[]
}

async function convertImageToDataUrl(imageUrl: string, label = "image"): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(imageUrl, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[${label}] Failed to fetch: ${response.status}`)
      return "/placeholder.svg?width=100&height=100"
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const mimeType = response.headers.get("content-type") || "image/jpeg"
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error(`[${label}] Error converting image:`, error)
    return "/placeholder.svg?width=100&height=100"
  }
}

export async function generateCollageImageBuffer(params: GenerateCollageImageParams): Promise<Buffer> {
  const { title1, title2, cards1, cards2 } = params

  const bgWidth = 1536
  const bgHeight = 1024
  const gridWidth = 1416 // 1536 - 60px padding on each side

  // Calculate layouts
  const layout1 = calculateGridLayout(cards1.length)
  const layout2 = calculateGridLayout(cards2.length)
  const zones = calculateUniformSpacing(cards1.length, cards2.length)

  // Load background image
  const bgUrl = new URL("/coragu_backimage.png", process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com").href
  const bgDataUrl = await convertImageToDataUrl(bgUrl, "background")

  // Convert all card images to Data URLs
  const cards1WithData = await Promise.all(
    cards1.map(async (card) => ({
      ...card,
      dataUrl: await convertImageToDataUrl(card.imageUrl, `card1-${card.id}`),
    })),
  )

  const cards2WithData = await Promise.all(
    cards2.map(async (card) => ({
      ...card,
      dataUrl: await convertImageToDataUrl(card.imageUrl, `card2-${card.id}`),
    })),
  )

  const imageResponse = new ImageResponse(
    <div
      style={{
        width: bgWidth,
        height: bgHeight,
        display: "flex",
        position: "relative",
      }}
    >
      {/* Background */}
      <img
        src={bgDataUrl || "/placeholder.svg"}
        alt="background"
        style={{ width: bgWidth, height: bgHeight, position: "absolute" }}
      />

      {/* Title 1 */}
      <div
        style={{
          position: "absolute",
          top: zones.zone1Y + 25,
          left: 60,
          color: "#FFFFFF",
          fontSize: 28,
          fontWeight: "bold",
        }}
      >
        {title1}
      </div>

      {/* Cards 1 Grid */}
      <div
        style={{
          position: "absolute",
          top: zones.zone2Y,
          left: 60,
          display: "flex",
          flexWrap: "wrap",
          width: gridWidth,
          gap: layout1.spacing,
        }}
      >
        {cards1WithData.map((card, idx) => (
          <img
            key={idx}
            src={card.dataUrl || "/placeholder.svg"}
            alt={card.name}
            style={{
              width: layout1.cardSize,
              height: layout1.cardSize,
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
        ))}
      </div>

      {/* Title 2 */}
      <div
        style={{
          position: "absolute",
          top: zones.zone3Y + 25,
          left: 60,
          color: "#FFFFFF",
          fontSize: 28,
          fontWeight: "bold",
        }}
      >
        {title2}
      </div>

      {/* Cards 2 Grid */}
      <div
        style={{
          position: "absolute",
          top: zones.zone4Y,
          left: 60,
          display: "flex",
          flexWrap: "wrap",
          width: gridWidth,
          gap: layout2.spacing,
        }}
      >
        {cards2WithData.map((card, idx) => (
          <img
            key={idx}
            src={card.dataUrl || "/placeholder.svg"}
            alt={card.name}
            style={{
              width: layout2.cardSize,
              height: layout2.cardSize,
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
        ))}
      </div>
    </div>,
    {
      width: bgWidth,
      height: bgHeight,
    },
  )

  const arrayBuffer = await imageResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
