/**
 * コラージュ画像生成ロジック（最適化版）
 *
 * 新しいアプローチ:
 * - 10列固定レイアウト
 * - カード比率63:88を保持（ポケモンカード標準）
 * - 全セクションで統一されたカードサイズ
 * - カード間余白なし、画面幅を最大活用
 */

// キャンバスサイズ
const CANVAS_WIDTH = 1536
const CANVAS_HEIGHT = 1024

// レイアウト設定
const TITLE_HEIGHT = 60
const FOOTER_HEIGHT = 40
const COLS = 10 // 10列固定

// カード縦横比（63mm × 88mm）
const CARD_ASPECT_RATIO = 63 / 88

interface CardData {
  id: number
  name: string
  imageUrl: string
  packName?: string
}

interface GridLayout {
  rows: number
  cols: number
  cardWidth: number
  cardHeight: number
  totalWidth: number
  totalHeight: number
}

/**
 * セクションのレイアウトを計算
 */
function calculateSectionLayout(cardCount: number): {
  cols: number
  rows: number
  cardWidth: number
  cardHeight: number
  sectionHeight: number
} {
  // 10列固定（カード枚数が10未満の場合はカード枚数）
  const cols = Math.min(cardCount, COLS)
  const rows = Math.ceil(cardCount / cols)

  // 統一カードサイズ（画面幅を列数で等分、余白なし）
  const cardWidth = CANVAS_WIDTH / cols
  // カードの高さを正しいアスペクト比（63:88）で計算
  const cardHeight = cardWidth / CARD_ASPECT_RATIO

  // セクション高さはカード高さ × 行数（カードは重ならない）
  const sectionHeight = cardHeight * rows

  return {
    cols,
    rows,
    cardWidth,
    cardHeight,
    sectionHeight,
  }
}

/**
 * カード枚数からグリッドレイアウトを計算（後方互換性のため残す）
 */
export function calculateGridLayout(cardCount: number): GridLayout {
  const layout = calculateSectionLayout(cardCount)

  return {
    rows: layout.rows,
    cols: layout.cols,
    cardWidth: layout.cardWidth,
    cardHeight: layout.cardHeight,
    totalWidth: layout.cardWidth * layout.cols,
    totalHeight: layout.sectionHeight,
  }
}

/**
 * 均一スペース（Zone間）を計算
 */
export function calculateUniformSpacing(
  cards1Count: number,
  cards2Count: number,
): {
  spacing: number
  zone1Y: number
  zone2Y: number
  zone3Y: number
  zone4Y: number
  zone2Height: number
  zone4Height: number
  unifiedCardWidth: number
  unifiedCardHeight: number
  layout1: GridLayout
  layout2: GridLayout
} {
  // 統一カードサイズを計算（10列固定、画面幅いっぱい）
  const unifiedCardWidth = CANVAS_WIDTH / COLS
  const unifiedCardHeight = unifiedCardWidth / CARD_ASPECT_RATIO

  // セクション1のレイアウトを計算
  const cols1 = Math.min(cards1Count, COLS)
  const rows1 = Math.ceil(cards1Count / cols1)
  const sectionHeight1 = unifiedCardHeight * rows1
  const layout1: GridLayout = {
    cols: cols1,
    rows: rows1,
    cardWidth: unifiedCardWidth,
    cardHeight: unifiedCardHeight,
    totalWidth: unifiedCardWidth * cols1,
    totalHeight: sectionHeight1,
  }

  // セクション2のレイアウトを計算
  const cols2 = Math.min(cards2Count, COLS)
  const rows2 = Math.ceil(cards2Count / cols2)
  const sectionHeight2 = unifiedCardHeight * rows2
  const layout2: GridLayout = {
    cols: cols2,
    rows: rows2,
    cardWidth: unifiedCardWidth,
    cardHeight: unifiedCardHeight,
    totalWidth: unifiedCardWidth * cols2,
    totalHeight: sectionHeight2,
  }

  // 各要素のY座標を計算
  let title1Y = 0
  let section1Y = TITLE_HEIGHT
  let title2Y = TITLE_HEIGHT + layout1.totalHeight
  let section2Y = TITLE_HEIGHT + layout1.totalHeight + TITLE_HEIGHT
  let totalHeight = TITLE_HEIGHT + layout1.totalHeight + TITLE_HEIGHT + layout2.totalHeight + FOOTER_HEIGHT

  // 高さオーバーの場合、統一カードサイズを縮小
  if (totalHeight > CANVAS_HEIGHT) {
    const scale = (CANVAS_HEIGHT - TITLE_HEIGHT * 2 - FOOTER_HEIGHT) / (layout1.totalHeight + layout2.totalHeight)

    // 統一カードサイズをスケーリング（両セクションで同じサイズ）
    const scaledCardHeight = unifiedCardHeight * scale
    const scaledCardWidth = scaledCardHeight * CARD_ASPECT_RATIO

    layout1.cardHeight = scaledCardHeight
    layout1.cardWidth = scaledCardWidth
    layout1.totalHeight = layout1.cardHeight * layout1.rows

    layout2.cardHeight = scaledCardHeight
    layout2.cardWidth = scaledCardWidth
    layout2.totalHeight = layout2.cardHeight * layout2.rows

    // Y座標を再計算
    title2Y = TITLE_HEIGHT + layout1.totalHeight
    section2Y = TITLE_HEIGHT + layout1.totalHeight + TITLE_HEIGHT
    totalHeight = TITLE_HEIGHT + layout1.totalHeight + TITLE_HEIGHT + layout2.totalHeight + FOOTER_HEIGHT
  }

  const spacing = 0 // カード間余白なし

  console.log(`[calculateUniformSpacing] ========================================`)
  console.log(`[calculateUniformSpacing] Cards1: ${cards1Count}, Cards2: ${cards2Count}`)
  console.log(`[calculateUniformSpacing] Unified Card Size: ${layout1.cardWidth}w × ${layout1.cardHeight}h`)
  console.log(
    `[calculateUniformSpacing] Layout1: ${layout1.cols}×${layout1.rows}, totalHeight: ${layout1.totalHeight}px`,
  )
  console.log(
    `[calculateUniformSpacing] Layout2: ${layout2.cols}×${layout2.rows}, totalHeight: ${layout2.totalHeight}px`,
  )
  console.log(`[calculateUniformSpacing] Zone1Y (Title1): ${title1Y}px`)
  console.log(`[calculateUniformSpacing] Zone2Y (Cards1): ${section1Y}px`)
  console.log(`[calculateUniformSpacing] Zone3Y (Title2): ${title2Y}px`)
  console.log(`[calculateUniformSpacing] Zone4Y (Cards2): ${section2Y}px`)
  console.log(`[calculateUniformSpacing] Total height: ${totalHeight}px`)
  console.log(`[calculateUniformSpacing] ========================================`)

  return {
    spacing,
    zone1Y: title1Y,
    zone2Y: section1Y,
    zone3Y: title2Y,
    zone4Y: section2Y,
    zone2Height: layout1.totalHeight,
    zone4Height: layout2.totalHeight,
    unifiedCardWidth: layout1.cardWidth,
    unifiedCardHeight: layout1.cardHeight,
    layout1,
    layout2,
  }
}

/**
 * カードグリッド配置座標を計算
 */
export function calculateCardPositions(
  layout: GridLayout,
  startX: number,
  startY: number,
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = []

  for (let i = 0; i < layout.rows * layout.cols; i++) {
    const row = Math.floor(i / layout.cols)
    const col = i % layout.cols
    const x = startX + col * layout.cardWidth
    const y = startY + row * layout.cardHeight
    positions.push({ x: Math.round(x), y: Math.round(y) })
  }

  return positions
}

/**
 * カード画像をData URLに変換
 */
async function convertImageToDataUrl(imageUrl: string | null, label = "card"): Promise<string | null> {
  if (!imageUrl) {
    console.log(`[${label}] No image URL provided`)
    return null
  }

  try {
    console.log(`[${label}] Fetching image:`, imageUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(imageUrl, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

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
 * 複数カード画像を並列で取得
 */
export async function fetchCardImages(cards: CardData[]): Promise<(string | null)[]> {
  return Promise.all(cards.map((card, index) => convertImageToDataUrl(card.imageUrl, `card-${index + 1}`)))
}
