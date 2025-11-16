import sharp from "sharp"
import { calculateUniformSpacing, calculateCardPositions } from "@/lib/collage-generator"

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
 *
 * 最適化版：
 * - 両セクションが収まる最大カードサイズを自動計算
 * - カード枚数に関係なく美しいレイアウトを実現
 */
export async function generateCollageImageBuffer(params: GenerateCollageImageParams): Promise<Buffer> {
  const { title1, title2, cards1, cards2 } = params

  console.log(`[generateCollageImageBuffer] ========================================`)
  console.log(`[generateCollageImageBuffer] Starting generation for collage ${params.collageId}`)
  console.log(`[generateCollageImageBuffer] Cards1: ${cards1.length}, Cards2: ${cards2.length}`)

  // 背景画像を取得
  const bgImagePath = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"}/coragu_backimage.png`
  const bgBuffer = await fetchImageBuffer(bgImagePath)

  if (!bgBuffer) {
    throw new Error("Failed to load background image")
  }

  // 最適なスペーシングとレイアウトを計算
  const zones = calculateUniformSpacing(cards1.length, cards2.length)
  const optimalCardSize = zones.optimalCardSize
  const layout1 = zones.layout1
  const layout2 = zones.layout2

  console.log(`[generateCollageImageBuffer] Optimal cardSize: ${optimalCardSize}px`)
  console.log(`[generateCollageImageBuffer] Layout1:`, layout1)
  console.log(`[generateCollageImageBuffer] Layout2:`, layout2)
  console.log(`[generateCollageImageBuffer] Zones:`, zones)

  // 背景画像をリサイズ
  const composite = sharp(bgBuffer).resize(1536, 1024, { fit: "cover" })

  // タイトル背景（ピンク色・半透明）
  const title1BgSvg = `
    <svg width="1536" height="1024">
      <rect x="0" y="${zones.zone1Y}" width="1536" height="60"
            fill="rgb(236, 72, 153)" opacity="0.95" />
    </svg>
  `

  const title2BgSvg = `
    <svg width="1536" height="1024">
      <rect x="0" y="${zones.zone3Y}" width="1536" height="60"
            fill="rgb(59, 130, 246)" opacity="0.95" />
    </svg>
  `

  // タイトルテキスト（影付きで視認性向上）
  const title1TextSvg = Buffer.from(`
    <svg width="1536" height="1024">
      <text 
        x="768" 
        y="${zones.zone1Y + 45}" 
        fontFamily="Arial, sans-serif" 
        fontSize="48" 
        fontWeight="bold" 
        fill="white" 
        textAnchor="middle"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="2"
      >${title1.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</text>
    </svg>
  `)

  const title2TextSvg = Buffer.from(`
    <svg width="1536" height="1024">
      <text 
        x="768" 
        y="${zones.zone3Y + 45}" 
        fontFamily="Arial, sans-serif" 
        fontSize="48" 
        fontWeight="bold" 
        fill="white" 
        textAnchor="middle"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="2"
      >${title2.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")}</text>
    </svg>
  `)

  // コンポジット配列を作成
  const compositeArray: sharp.OverlayOptions[] = []

  // タイトル背景を追加
  compositeArray.push({
    input: Buffer.from(title1BgSvg),
    top: 0,
    left: 0,
  })

  compositeArray.push({
    input: Buffer.from(title2BgSvg),
    top: 0,
    left: 0,
  })

  compositeArray.push({
    input: title1TextSvg,
    top: 0,
    left: 0,
  })

  compositeArray.push({
    input: title2TextSvg,
    top: 0,
    left: 0,
  })

  // カード画像を処理（最適なカードサイズを使用）
  console.log(`[generateCollageImageBuffer] Processing ${cards1.length} cards for section 1...`)
  const cardBuffers1 = await Promise.all(
    cards1.map(async (card, index) => {
      const buffer = await fetchImageBuffer(card.imageUrl)
      if (!buffer) {
        console.warn(`[generateCollageImageBuffer] Failed to fetch card ${index + 1} (ID: ${card.id})`)
        return null
      }

      try {
        // 最適なカードサイズでリサイズ（正方形、contain）
        return await sharp(buffer)
          .resize(optimalCardSize, optimalCardSize, {
            fit: "cover",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .png()
          .toBuffer()
      } catch (error) {
        console.error(`[generateCollageImageBuffer] Error processing card ${index + 1} (ID: ${card.id}):`, error)
        return null
      }
    }),
  )

  console.log(`[generateCollageImageBuffer] Processing ${cards2.length} cards for section 2...`)
  const cardBuffers2 = await Promise.all(
    cards2.map(async (card, index) => {
      const buffer = await fetchImageBuffer(card.imageUrl)
      if (!buffer) {
        console.warn(`[generateCollageImageBuffer] Failed to fetch card ${index + 1} (ID: ${card.id})`)
        return null
      }

      try {
        // 最適なカードサイズでリサイズ（正方形、contain）
        return await sharp(buffer)
          .resize(optimalCardSize, optimalCardSize, {
            fit: "",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .png()
          .toBuffer()
      } catch (error) {
        console.error(`[generateCollageImageBuffer] Error processing card ${index + 1} (ID: ${card.id}):`, error)
        return null
      }
    }),
  )

  // カード配置座標を計算
  const positions1 = calculateCardPositions(layout1, 20, zones.zone2Y)
  const positions2 = calculateCardPositions(layout2, 20, zones.zone4Y)

  console.log(`[generateCollageImageBuffer] Calculated ${positions1.length} positions for section 1`)
  console.log(`[generateCollageImageBuffer] Calculated ${positions2.length} positions for section 2`)

  // カード画像を配置
  let successCount1 = 0
  cardBuffers1.forEach((buffer, index) => {
    if (buffer && positions1[index]) {
      compositeArray.push({
        input: buffer,
        top: Math.round(positions1[index].y),
        left: Math.round(positions1[index].x),
      })
      successCount1++
    }
  })

  let successCount2 = 0
  cardBuffers2.forEach((buffer, index) => {
    if (buffer && positions2[index]) {
      compositeArray.push({
        input: buffer,
        top: Math.round(positions2[index].y),
        left: Math.round(positions2[index].x),
      })
      successCount2++
    }
  })

  console.log(`[generateCollageImageBuffer] Placed ${successCount1}/${cards1.length} cards in section 1`)
  console.log(`[generateCollageImageBuffer] Placed ${successCount2}/${cards2.length} cards in section 2`)

  // 最終的な画像を合成
  const finalBuffer = await composite.composite(compositeArray).png().toBuffer()

  console.log(`[generateCollageImageBuffer] ✅ Image generated successfully, size: ${finalBuffer.length} bytes`)
  console.log(`[generateCollageImageBuffer] ========================================`)

  return finalBuffer
}
