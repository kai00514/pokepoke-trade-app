import sharp from "sharp"
import { calculateGridLayout, calculateUniformSpacing, calculateCardPositions } from "@/lib/collage-generator"

interface CardData {
  id: number
  name: string
  imageUrl: string
}

interface GenerateCollageImageParams {
  collageId: string
  title1: string
  title2: string
  cards1: CardData[]
  cards2: CardData[]
}

/**
 * 画像URLをバッファとして取得
 */
async function fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
  let absoluteUrl = imageUrl
  if (imageUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"
    absoluteUrl = `${baseUrl}${imageUrl}`
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(absoluteUrl, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      console.error(`Failed to fetch image ${absoluteUrl}: ${response.status}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error(`Error fetching image ${absoluteUrl}:`, error)
    return null
  }
}

/**
 * コラージュ画像を生成してBufferとして返す（1536x1024px）
 */
export async function generateCollageImageBuffer(params: GenerateCollageImageParams): Promise<Buffer> {
  const { title1, title2, cards1, cards2 } = params

  console.log(`[generateCollageImageBuffer] Starting generation for collage ${params.collageId}`)
  console.log(`[generateCollageImageBuffer] Cards1: ${cards1.length}, Cards2: ${cards2.length}`)

  const bgImagePath = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"}/coragu_backimage.png`
  const bgBuffer = await fetchImageBuffer(bgImagePath)

  if (!bgBuffer) {
    throw new Error("Failed to load background image")
  }

  const layout1 = calculateGridLayout(cards1.length)
  const layout2 = calculateGridLayout(cards2.length)
  const zones = calculateUniformSpacing(cards1.length, cards2.length)

  console.log(`[generateCollageImageBuffer] Layout1:`, layout1)
  console.log(`[generateCollageImageBuffer] Layout2:`, layout2)
  console.log(`[generateCollageImageBuffer] Zones:`, zones)

  const composite = sharp(bgBuffer).resize(1536, 1024, { fit: "cover" })

  const title1Svg = `
    <svg width="1536" height="1024">
      <text x="60" y="${zones.zone1Y + 50}" font-size="28" font-weight="bold" fill="white">
        ${title1}
      </text>
    </svg>
  `

  const title2Svg = `
    <svg width="1536" height="1024">
      <text x="60" y="${zones.zone3Y + 50}" font-size="28" font-weight="bold" fill="white">
        ${title2}
      </text>
    </svg>
  `

  const cardBuffers1 = await Promise.all(
    cards1.map(async (card) => {
      const buffer = await fetchImageBuffer(card.imageUrl)
      if (!buffer) return null

      try {
        return await sharp(buffer)
          .resize(layout1.cardSize, layout1.cardSize, {
            fit: "cover",
            position: "center",
          })
          .png()
          .toBuffer()
      } catch (error) {
        console.error(`Error processing card image ${card.id}:`, error)
        return null
      }
    }),
  )

  const cardBuffers2 = await Promise.all(
    cards2.map(async (card) => {
      const buffer = await fetchImageBuffer(card.imageUrl)
      if (!buffer) return null

      try {
        return await sharp(buffer)
          .resize(layout2.cardSize, layout2.cardSize, {
            fit: "cover",
            position: "center",
          })
          .png()
          .toBuffer()
      } catch (error) {
        console.error(`Error processing card image ${card.id}:`, error)
        return null
      }
    }),
  )

  const positions1 = calculateCardPositions(layout1, 60, zones.zone2Y)
  const positions2 = calculateCardPositions(layout2, 60, zones.zone4Y)

  const compositeArray: sharp.OverlayOptions[] = []

  compositeArray.push({
    input: Buffer.from(title1Svg),
    top: 0,
    left: 0,
  })

  compositeArray.push({
    input: Buffer.from(title2Svg),
    top: 0,
    left: 0,
  })

  cardBuffers1.forEach((buffer, index) => {
    if (buffer && positions1[index]) {
      compositeArray.push({
        input: buffer,
        top: Math.round(positions1[index].y),
        left: Math.round(positions1[index].x),
      })
    }
  })

  cardBuffers2.forEach((buffer, index) => {
    if (buffer && positions2[index]) {
      compositeArray.push({
        input: buffer,
        top: Math.round(positions2[index].y),
        left: Math.round(positions2[index].x),
      })
    }
  })

  const finalBuffer = await composite.composite(compositeArray).png().toBuffer()

  console.log(`[generateCollageImageBuffer] ✅ Image generated successfully, size: ${finalBuffer.length} bytes`)

  return finalBuffer
}
