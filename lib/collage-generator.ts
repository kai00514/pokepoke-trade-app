/**
 * コラージュ画像生成ロジック
 * ImageResponse を使用して、複数カードのコラージュ画像を動的生成
 */

interface CardData {
  id: number
  name: string
  imageUrl: string
  packName?: string
}

interface GridLayout {
  rows: number
  cols: number
  cardSize: number
  spacing: number
  totalWidth: number
  totalHeight: number
}

/**
 * カード枚数からグリッドレイアウトを計算
 */
export function calculateGridLayout(cardCount: number): GridLayout {
  const maxWidth = 1496 // 配置幅（1536 - 左右パディング20px × 2）
  const spacing = 8 // カード間スペース
  const maxCols = 10 // 最大カラム数（固定）

  if (cardCount === 0) {
    return {
      rows: 0,
      cols: 0,
      cardSize: 0,
      spacing,
      totalWidth: maxWidth,
      totalHeight: 0,
    }
  }

  // 実際に使用するカラム数（カード枚数が少ない場合はそれに合わせる）
  const cols = Math.min(cardCount, maxCols)

  // カードサイズを計算（最大カラム数を基準にすることで一定サイズを保つ）
  const cardSize = Math.floor((maxWidth - (maxCols - 1) * spacing) / maxCols)

  // 必要な行数
  const rows = Math.ceil(cardCount / cols)

  // グリッドの実際の幅と高さ
  const totalWidth = cols * cardSize + (cols - 1) * spacing
  const totalHeight = rows * cardSize + (rows - 1) * spacing

  return { rows, cols, cardSize, spacing, totalWidth, totalHeight }
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
} {
  const layout1 = calculateGridLayout(cards1Count)
  const layout2 = calculateGridLayout(cards2Count)

  const zone1Y = 0
  const zone1Height = 80

  const cards1Height = layout1.totalHeight
  const zone2Y = zone1Y + zone1Height
  const zone2Height = cards1Height
  const zone2EndY = zone2Y + zone2Height

  const zone3Y_tentative = zone2EndY
  const zone3Height = 80

  const cards2Height = layout2.totalHeight
  const zone4Y_tentative = zone3Y_tentative + zone3Height
  const zone4Height = cards2Height
  const zone4EndY = zone4Y_tentative + zone4Height

  const totalUsedHeight = zone1Height + cards1Height + zone3Height + cards2Height
  const totalAvailableHeight = 1024
  const spacingSum = totalAvailableHeight - totalUsedHeight

  const uniformSpacing = Math.floor(spacingSum / 4)

  const adjustedZone1Y = zone1Y
  const adjustedZone2Y = adjustedZone1Y + zone1Height + uniformSpacing
  const adjustedZone3Y = adjustedZone2Y + cards1Height + uniformSpacing
  const adjustedZone4Y = adjustedZone3Y + zone3Height + uniformSpacing

  return {
    spacing: uniformSpacing,
    zone1Y: adjustedZone1Y,
    zone2Y: adjustedZone2Y,
    zone3Y: adjustedZone3Y,
    zone4Y: adjustedZone4Y,
    zone2Height: cards1Height,
    zone4Height: cards2Height,
  }
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
    const x = startX + col * (layout.cardSize + layout.spacing)
    const y = startY + row * (layout.cardSize + layout.spacing)
    positions.push({ x, y })
  }

  return positions
}
