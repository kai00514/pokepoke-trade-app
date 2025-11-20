import { ImageResponse } from "@vercel/og"
import sharp from "sharp"

interface CardData {
  id: number
  name: string
  imageUrl: string
}

interface CardDataWithPng extends CardData {
  pngDataUrl: string
}

interface GenerateCollageImageParams {
  collageId: string
  title1: string
  title2: string
  cards1: CardData[]
  cards2: CardData[]
}

// キャンバスサイズ
const CANVAS_WIDTH = 1536
const CANVAS_HEIGHT = 1024

// レイアウト設定
const TITLE_HEIGHT = 60
const FOOTER_HEIGHT = 40
const COLS = 10 // 10列固定

// カード縦横比（63mm × 88mm）
const CARD_ASPECT_RATIO = 63 / 88

/**
 * カード配置座標を計算
 */
function calculateCardPositions(
  cardCount: number,
  sectionY: number,
  cols: number,
  cardWidth: number,
  cardHeight: number
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = []

  for (let i = 0; i < cardCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    positions.push({
      x: Math.round(col * cardWidth),
      y: Math.round(sectionY + row * cardHeight),
    })
  }

  return positions
}

/**
 * WebP画像をPNG Data URLに変換
 */
async function convertToPngDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // sharpでPNGに変換
    const pngBuffer = await sharp(buffer).png().toBuffer()
    const base64 = pngBuffer.toString("base64")
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error(`Error converting image ${imageUrl}:`, error)
    throw error
  }
}

/**
 * @vercel/ogを使用してコラージュ画像を生成
 * 戻り値をArrayBufferからBufferに変更
 */
export async function generateCollageImageBuffer(params: GenerateCollageImageParams): Promise<Buffer> {
  const { title1, title2, cards1, cards2 } = params
  const cards1Count = cards1.length
  const cards2Count = cards2.length

  console.log("=".repeat(60))
  console.log("コラージュ画像生成開始 (@vercel/og)")
  console.log(`📊 求めるカード: ${cards1Count}枚`)
  console.log(`📊 譲れるカード: ${cards2Count}枚`)
  console.log("=".repeat(60))

  // WebP画像をPNG Data URLに変換
  console.log("\n[Converting WebP images to PNG...]")
  const cards1WithPng: CardDataWithPng[] = await Promise.all(
    cards1.map(async (card) => ({
      ...card,
      pngDataUrl: await convertToPngDataUrl(card.imageUrl),
    }))
  )

  const cards2WithPng: CardDataWithPng[] = await Promise.all(
    cards2.map(async (card) => ({
      ...card,
      pngDataUrl: await convertToPngDataUrl(card.imageUrl),
    }))
  )
  console.log("[✅ Image conversion complete]")

  // 統一カードサイズを計算（10列固定、画面幅いっぱい）
  const unifiedCardWidth = CANVAS_WIDTH / COLS
  const unifiedCardHeight = unifiedCardWidth / CARD_ASPECT_RATIO

  console.log(`\n[Unified Card Size]`)
  console.log(`  Card size: ${unifiedCardWidth}w × ${unifiedCardHeight}h`)

  // セクション1のレイアウトを計算
  console.log(`\n[Section 1] ${cards1Count} cards:`)
  const cols1 = Math.min(cards1Count, COLS)
  const rows1 = Math.ceil(cards1Count / cols1)
  const sectionHeight1 = unifiedCardHeight * rows1
  let layout1 = {
    cols: cols1,
    rows: rows1,
    cardWidth: unifiedCardWidth,
    cardHeight: unifiedCardHeight,
    sectionHeight: sectionHeight1,
  }
  console.log(`  Layout: ${layout1.cols}cols × ${layout1.rows}rows`)
  console.log(`  Section height: ${layout1.sectionHeight}px`)

  // セクション2のレイアウトを計算
  console.log(`\n[Section 2] ${cards2Count} cards:`)
  const cols2 = Math.min(cards2Count, COLS)
  const rows2 = Math.ceil(cards2Count / cols2)
  const sectionHeight2 = unifiedCardHeight * rows2
  let layout2 = {
    cols: cols2,
    rows: rows2,
    cardWidth: unifiedCardWidth,
    cardHeight: unifiedCardHeight,
    sectionHeight: sectionHeight2,
  }
  console.log(`  Layout: ${layout2.cols}cols × ${layout2.rows}rows`)
  console.log(`  Section height: ${layout2.sectionHeight}px`)

  // Y座標を計算
  let title1Y = 0
  let section1Y = TITLE_HEIGHT
  let title2Y = TITLE_HEIGHT + layout1.sectionHeight
  let section2Y = TITLE_HEIGHT + layout1.sectionHeight + TITLE_HEIGHT
  let totalHeight =
    TITLE_HEIGHT + layout1.sectionHeight + TITLE_HEIGHT + layout2.sectionHeight + FOOTER_HEIGHT

  console.log(`\n[Total Layout]`)
  console.log(`  Total height: ${totalHeight}px`)

  // 高さオーバーの場合、統一カードサイズを縮小
  if (totalHeight > CANVAS_HEIGHT) {
    console.error(`  ❌ Total height ${totalHeight}px exceeds canvas height ${CANVAS_HEIGHT}px!`)
    console.error(`  Adjusting layout...`)

    const scale =
      (CANVAS_HEIGHT - TITLE_HEIGHT * 2 - FOOTER_HEIGHT) / (layout1.sectionHeight + layout2.sectionHeight)
    console.log(`  Scaling factor: ${(scale * 100).toFixed(1)}%`)

    const scaledCardHeight = unifiedCardHeight * scale
    const scaledCardWidth = scaledCardHeight * CARD_ASPECT_RATIO

    layout1 = {
      ...layout1,
      cardHeight: scaledCardHeight,
      cardWidth: scaledCardWidth,
      sectionHeight: scaledCardHeight * layout1.rows,
    }

    layout2 = {
      ...layout2,
      cardHeight: scaledCardHeight,
      cardWidth: scaledCardWidth,
      sectionHeight: scaledCardHeight * layout2.rows,
    }

    title2Y = TITLE_HEIGHT + layout1.sectionHeight
    section2Y = TITLE_HEIGHT + layout1.sectionHeight + TITLE_HEIGHT
    totalHeight = TITLE_HEIGHT + layout1.sectionHeight + TITLE_HEIGHT + layout2.sectionHeight + FOOTER_HEIGHT

    console.log(`  Adjusted card size: ${scaledCardWidth}w × ${scaledCardHeight}h`)
    console.log(`  Adjusted total height: ${totalHeight}px`)
  }

  // カード位置を計算
  const positions1 = calculateCardPositions(
    cards1Count,
    section1Y,
    layout1.cols,
    layout1.cardWidth,
    layout1.cardHeight
  )
  const positions2 = calculateCardPositions(
    cards2Count,
    section2Y,
    layout2.cols,
    layout2.cardWidth,
    layout2.cardHeight
  )

  console.log("\n[Generating image with @vercel/og...]")

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          display: "flex",
          position: "relative",
          backgroundImage: "url(https://www.pokelnk.com/coragu_backimage.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* タイトル1背景 */}
        <div
          style={{
            position: "absolute",
            top: title1Y,
            left: 0,
            width: CANVAS_WIDTH,
            height: TITLE_HEIGHT,
            backgroundColor: "rgb(236, 72, 153)",
            opacity: 0.95,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: "white",
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {title1}
          </span>
        </div>

        {/* タイトル2背景 */}
        <div
          style={{
            position: "absolute",
            top: title2Y,
            left: 0,
            width: CANVAS_WIDTH,
            height: TITLE_HEIGHT,
            backgroundColor: "rgb(59, 130, 246)",
            opacity: 0.95,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: "white",
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {title2}
          </span>
        </div>

        {/* カード1を配置 */}
        {cards1WithPng.map((card, index) => (
          <img
            key={`card1-${card.id}`}
            src={card.pngDataUrl}
            style={{
              position: "absolute",
              left: positions1[index].x,
              top: positions1[index].y,
              width: layout1.cardWidth,
              height: layout1.cardHeight,
              objectFit: "contain",
            }}
          />
        ))}

        {/* カード2を配置 */}
        {cards2WithPng.map((card, index) => (
          <img
            key={`card2-${card.id}`}
            src={card.pngDataUrl}
            style={{
              position: "absolute",
              left: positions2[index].x,
              top: positions2[index].y,
              width: layout2.cardWidth,
              height: layout2.cardHeight,
              objectFit: "contain",
            }}
          />
        ))}

        {/* フッター */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: CANVAS_WIDTH,
            height: FOOTER_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: "rgba(0,0,0,0.6)",
            }}
          >
            ポケポケコラージュ画像メーカー@PokeLink
          </span>
        </div>
      </div>
    ),
    {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    }
  )

  console.log("✅ コラージュ画像生成完了！")
  console.log("=".repeat(60))

  // ArrayBufferをBufferに変換して返す
  const arrayBuffer = await imageResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
