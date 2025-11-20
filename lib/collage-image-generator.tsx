import sharp from "sharp"

// キャンバスサイズ
const CANVAS_WIDTH = 1536
const CANVAS_HEIGHT = 1024

// レイアウト設定
const TITLE_HEIGHT = 60
const FOOTER_HEIGHT = 40
const COLS = 10 // 10列固定

// カード縦横比（63mm × 88mm）
const CARD_ASPECT_RATIO = 63 / 88

// 背景画像URL
const BACKGROUND_IMAGE_URL = "https://www.pokelnk.com/coragu_backimage.png"

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
async function fetchImageBuffer(imageUrl: string): Promise<Buffer> {
  console.log(`Fetching image: ${imageUrl}`)
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

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
 * コラージュ画像を生成してBufferとして返す（1536x1024px）
 *
 * test-collage-generation2.ts の完全移植版:
 * - 10列固定レイアウト
 * - カード比率63:88を保持（ポケモンカード標準）
 * - 両セクションで統一されたカードサイズ
 * - 高さオーバー時の自動縮小機能
 * - フッター付き
 */
export async function generateCollageImageBuffer(params: GenerateCollageImageParams): Promise<Buffer> {
  const { title1, title2, cards1, cards2 } = params
  const cards1Count = cards1.length
  const cards2Count = cards2.length

  console.log("=".repeat(60))
  console.log("コラージュ画像生成開始")
  console.log(`📊 求めるカード: ${cards1Count}枚`)
  console.log(`📊 譲れるカード: ${cards2Count}枚`)
  console.log("=".repeat(60))

  console.log("\nDownloading background image...")
  const bgImageBuffer = await fetchImageBuffer(BACKGROUND_IMAGE_URL)

  // 利用可能な高さを計算
  const availableHeight = CANVAS_HEIGHT - TITLE_HEIGHT * 2 - FOOTER_HEIGHT
  const maxSectionHeight = Math.floor(availableHeight / 2)

  console.log(`\n[Layout Planning]`)
  console.log(`  Canvas: ${CANVAS_WIDTH}w × ${CANVAS_HEIGHT}h`)
  console.log(`  Available height for cards: ${availableHeight}px`)
  console.log(`  Max section height (ideal): ${maxSectionHeight}px`)

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
  const layout1 = {
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
  const layout2 = {
    cols: cols2,
    rows: rows2,
    cardWidth: unifiedCardWidth,
    cardHeight: unifiedCardHeight,
    sectionHeight: sectionHeight2,
  }
  console.log(`  Layout: ${layout2.cols}cols × ${layout2.rows}rows`)
  console.log(`  Section height: ${layout2.sectionHeight}px`)

  // 各要素のY座標を計算（初期）
  let title1Y = 0
  let section1Y = TITLE_HEIGHT
  let title2Y = TITLE_HEIGHT + layout1.sectionHeight
  let section2Y = TITLE_HEIGHT + layout1.sectionHeight + TITLE_HEIGHT
  let totalHeight = TITLE_HEIGHT + layout1.sectionHeight + TITLE_HEIGHT + layout2.sectionHeight + FOOTER_HEIGHT

  console.log(`\n[Total Layout]`)
  console.log(`  Title 1: Y=${title1Y}, height=${TITLE_HEIGHT}`)
  console.log(`  Section 1: Y=${section1Y}, height=${layout1.sectionHeight}`)
  console.log(`  Title 2: Y=${title2Y}, height=${TITLE_HEIGHT}`)
  console.log(`  Section 2: Y=${section2Y}, height=${layout2.sectionHeight}`)
  console.log(`  Footer: Y=${CANVAS_HEIGHT - FOOTER_HEIGHT}, height=${FOOTER_HEIGHT}`)
  console.log(`  Total height: ${totalHeight}px`)

  if (totalHeight > CANVAS_HEIGHT) {
    console.error(`  ❌ Error: Total height ${totalHeight}px exceeds canvas height ${CANVAS_HEIGHT}px!`)
    console.error(`  Need to adjust layout...`)

    // 高さオーバーの場合、統一カードサイズを縮小
    const scale = (CANVAS_HEIGHT - TITLE_HEIGHT * 2 - FOOTER_HEIGHT) / (layout1.sectionHeight + layout2.sectionHeight)
    console.log(`  Scaling factor: ${(scale * 100).toFixed(1)}%`)

    // 統一カードサイズをスケーリング（両セクションで同じサイズ）
    const scaledCardHeight = unifiedCardHeight * scale
    const scaledCardWidth = scaledCardHeight * CARD_ASPECT_RATIO

    layout1.cardHeight = scaledCardHeight
    layout1.cardWidth = scaledCardWidth
    layout1.sectionHeight = layout1.cardHeight * layout1.rows

    layout2.cardHeight = scaledCardHeight
    layout2.cardWidth = scaledCardWidth
    layout2.sectionHeight = layout2.cardHeight * layout2.rows

    console.log(`  Adjusted Unified Card Size: ${scaledCardWidth}w × ${scaledCardHeight}h`)
    console.log(`  Adjusted Section 1 height: ${layout1.sectionHeight}px`)
    console.log(`  Adjusted Section 2 height: ${layout2.sectionHeight}px`)

    // Y座標を再計算
    title2Y = TITLE_HEIGHT + layout1.sectionHeight
    section2Y = TITLE_HEIGHT + layout1.sectionHeight + TITLE_HEIGHT
    totalHeight = TITLE_HEIGHT + layout1.sectionHeight + TITLE_HEIGHT + layout2.sectionHeight + FOOTER_HEIGHT

    console.log(`\n[Adjusted Total Layout]`)
    console.log(`  Title 1: Y=${title1Y}, height=${TITLE_HEIGHT}`)
    console.log(`  Section 1: Y=${section1Y}, height=${layout1.sectionHeight}`)
    console.log(`  Title 2: Y=${title2Y}, height=${TITLE_HEIGHT}`)
    console.log(`  Section 2: Y=${section2Y}, height=${layout2.sectionHeight}`)
    console.log(`  Footer: Y=${CANVAS_HEIGHT - FOOTER_HEIGHT}, height=${FOOTER_HEIGHT}`)
    console.log(`  Adjusted total height: ${totalHeight}px`)
  }

  // SVG要素を作成
  const title1BgSvg = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"><rect x="0" y="${title1Y}" width="${CANVAS_WIDTH}" height="${TITLE_HEIGHT}" fill="rgb(236, 72, 153)" opacity="0.95" /></svg>`
  const title2BgSvg = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"><rect x="0" y="${title2Y}" width="${CANVAS_WIDTH}" height="${TITLE_HEIGHT}" fill="rgb(59, 130, 246)" opacity="0.95" /></svg>`
  const title1TextSvg = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"><text x="${CANVAS_WIDTH / 2}" y="${title1Y + 45}" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" stroke="rgba(0,0,0,0.3)" stroke-width="2">${title1}</text></svg>`
  const title2TextSvg = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"><text x="${CANVAS_WIDTH / 2}" y="${title2Y + 45}" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" stroke="rgba(0,0,0,0.3)" stroke-width="2">${title2}</text></svg>`
  const footerTextSvg = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"><text x="${CANVAS_WIDTH / 2}" y="${CANVAS_HEIGHT - 12}" font-family="Arial, sans-serif" font-size="24" fill="rgba(0,0,0,0.6)" text-anchor="middle">ポケポケコラージュ画像メーカー@PokeLink</text></svg>`

  // カード座標を計算
  console.log("\nCalculating card positions...")
  const positions1 = calculateCardPositions(cards1Count, section1Y, layout1.cols, layout1.cardWidth, layout1.cardHeight)
  const positions2 = calculateCardPositions(cards2Count, section2Y, layout2.cols, layout2.cardWidth, layout2.cardHeight)

  // カード画像をダウンロードして処理
  console.log("\nPreparing card images for section 1...")
  const cardBuffers1 = await Promise.all(
    cards1.map(async (card) => {
      const buffer = await fetchImageBuffer(card.imageUrl)
      return await sharp(buffer)
        .resize(Math.round(layout1.cardWidth), Math.round(layout1.cardHeight), {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
    }),
  )

  console.log("\nPreparing card images for section 2...")
  const cardBuffers2 = await Promise.all(
    cards2.map(async (card) => {
      const buffer = await fetchImageBuffer(card.imageUrl)
      return await sharp(buffer)
        .resize(Math.round(layout2.cardWidth), Math.round(layout2.cardHeight), {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
    }),
  )

  console.log("\nBuilding composite array...")
  const compositeArray: sharp.OverlayOptions[] = []

  compositeArray.push({ input: Buffer.from(title1BgSvg), top: 0, left: 0 })
  compositeArray.push({ input: Buffer.from(title2BgSvg), top: 0, left: 0 })
  compositeArray.push({ input: Buffer.from(title1TextSvg), top: 0, left: 0 })
  compositeArray.push({ input: Buffer.from(title2TextSvg), top: 0, left: 0 })
  compositeArray.push({ input: Buffer.from(footerTextSvg), top: 0, left: 0 })

  cardBuffers1.forEach((buffer, index) => {
    compositeArray.push({
      input: buffer,
      top: positions1[index].y,
      left: positions1[index].x,
    })
  })

  cardBuffers2.forEach((buffer, index) => {
    compositeArray.push({
      input: buffer,
      top: positions2[index].y,
      left: positions2[index].x,
    })
  })

  console.log(`\nTotal composite layers: ${compositeArray.length}`)

  console.log("\nGenerating final image...")
  const finalBuffer = await sharp(bgImageBuffer)
    .resize(CANVAS_WIDTH, CANVAS_HEIGHT, { fit: "cover" })
    .composite(compositeArray)
    .png()
    .toBuffer()

  console.log("\n" + "=".repeat(60))
  console.log("✅ コラージュ画像生成完了！")
  console.log(`📊 ファイルサイズ: ${(finalBuffer.length / 1024).toFixed(2)} KB`)
  console.log("=".repeat(60))

  return finalBuffer
}
