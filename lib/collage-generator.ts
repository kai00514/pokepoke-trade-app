/**
 * コラージュ画像生成ロジック（最適化版）
 *
 * 新しいアプローチ:
 * - 両セクションが収まる最大カードサイズを自動計算
 * - カード枚数に関係なく、すべてが1枚の画像内に収まる
 * - 参照画像のような美しいレイアウトを実現
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

interface LayoutResult {
  cols: number
  rows: number
  gridWidth: number
  gridHeight: number
}

/**
 * 指定されたカードサイズで配置可能なレイアウトを計算
 */
function calculateLayoutForCardSize(
  cardCount: number,
  cardSize: number,
  maxWidth: number,
  spacing = 1, // カード間スペースを1pxに変更
  maxColsLimit = 12,
): LayoutResult {
  if (cardCount === 0) {
    return { cols: 0, rows: 0, gridWidth: 0, gridHeight: 0 }
  }

  // 幅に収まる最大カラム数
  const maxColsFromWidth = Math.floor((maxWidth + spacing) / (cardSize + spacing))

  // 最大カラム数を制限（背景が見えないようにカードを大きく）
  const maxCols = Math.min(maxColsFromWidth, maxColsLimit)

  // 実際のカラム数（カード枚数が少ない場合はそれに合わせる）
  const cols = Math.min(cardCount, maxCols)

  // 必要な行数
  const rows = Math.ceil(cardCount / cols)

  // グリッドサイズ
  const gridWidth = cols * cardSize + (cols - 1) * spacing
  const gridHeight = rows * cardSize + (rows - 1) * spacing

  return { cols, rows, gridWidth, gridHeight }
}

/**
 * 両方のセクションが収まる最適なカードサイズを見つける
 */
function findOptimalCardSize(cards1Count: number, cards2Count: number): number {
  const maxWidth = 1516 // パディングを減らして横幅を最大活用（1536 - 10px × 2）
  const maxHeight = 1004 // パディングを減らして縦幅を最大活用（1024 - 10px × 2）
  const titleHeight = 60
  const minSpacing = 5 // セクション間スペースを削減
  const cardSpacing = 1 // カード間スペースを1pxに変更
  const maxColsLimit = 12 // 最大カラム数を12に増やす

  const cardSizeCandidates = [200, 190, 180, 170, 160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50]

  for (const cardSize of cardSizeCandidates) {
    const layout1 = calculateLayoutForCardSize(cards1Count, cardSize, maxWidth, cardSpacing, maxColsLimit)
    const layout2 = calculateLayoutForCardSize(cards2Count, cardSize, maxWidth, cardSpacing, maxColsLimit)

    // 必要な高さを計算
    const requiredHeight =
      minSpacing + // 上パディング
      titleHeight + // タイトル1
      minSpacing + // タイトルとグリッド間
      layout1.gridHeight + // カードグリッド1
      minSpacing * 2 + // セクション間スペース
      titleHeight + // タイトル2
      minSpacing + // タイトルとグリッド間
      layout2.gridHeight + // カードグリッド2
      minSpacing // 下パディング

    // 収まるかチェック
    if (requiredHeight <= maxHeight) {
      console.log(`[findOptimalCardSize] Selected cardSize: ${cardSize}px`)
      console.log(
        `[findOptimalCardSize] Layout1: ${layout1.cols} cols × ${layout1.rows} rows (height: ${layout1.gridHeight}px)`,
      )
      console.log(
        `[findOptimalCardSize] Layout2: ${layout2.cols} cols × ${layout2.rows} rows (height: ${layout2.gridHeight}px)`,
      )
      console.log(`[findOptimalCardSize] Required height: ${requiredHeight}px / ${maxHeight}px`)
      return cardSize
    }
  }

  // 最小サイズでも収まらない場合
  console.warn(`[findOptimalCardSize] Using minimum cardSize: 40px`)
  return 40
}

/**
 * カード枚数からグリッドレイアウトを計算
 *
 * 注意: この関数は後方互換性のために残していますが、
 * 内部的には calculateUniformSpacing で決定された optimalCardSize を使用します
 */
export function calculateGridLayout(cardCount: number, optimalCardSize?: number): GridLayout {
  const maxWidth = 1496
  const spacing = 4 // カード間スペースを半分に
  const maxColsLimit = 10 // 最大カラム数を制限

  // optimalCardSize が渡されていない場合は、デフォルト値を使用（後方互換性）
  const cardSize = optimalCardSize || 140

  const layout = calculateLayoutForCardSize(cardCount, cardSize, maxWidth, spacing, maxColsLimit)

  return {
    rows: layout.rows,
    cols: layout.cols,
    cardSize: cardSize,
    spacing,
    totalWidth: layout.gridWidth,
    totalHeight: layout.gridHeight,
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
  optimalCardSize: number
  layout1: GridLayout
  layout2: GridLayout
} {
  const totalHeight = 1024
  const titleHeight = 60
  const minSpacing = 5 // セクション間スペースを削減
  const maxWidth = 1516 // パディングを減らす
  const cardSpacing = 1 // カード間スペースを1pxに変更
  const maxColsLimit = 12 // 最大カラム数を12に増やす

  // 最適なカードサイズを決定
  const optimalCardSize = findOptimalCardSize(cards1Count, cards2Count)

  // 各セクションのレイアウトを計算
  const layout1Result = calculateLayoutForCardSize(cards1Count, optimalCardSize, maxWidth, cardSpacing, maxColsLimit)
  const layout2Result = calculateLayoutForCardSize(cards2Count, optimalCardSize, maxWidth, cardSpacing, maxColsLimit)

  const layout1: GridLayout = {
    rows: layout1Result.rows,
    cols: layout1Result.cols,
    cardSize: optimalCardSize,
    spacing: cardSpacing,
    totalWidth: layout1Result.gridWidth,
    totalHeight: layout1Result.gridHeight,
  }

  const layout2: GridLayout = {
    rows: layout2Result.rows,
    cols: layout2Result.cols,
    cardSize: optimalCardSize,
    spacing: cardSpacing,
    totalWidth: layout2Result.gridWidth,
    totalHeight: layout2Result.gridHeight,
  }

  // 使用する高さの合計
  const usedHeight = titleHeight + layout1.totalHeight + titleHeight + layout2.totalHeight

  // 残りのスペースを分配（タイトル1後、セクション間、タイトル2後、下）
  // タイトル1は最上部に配置するため、上のスペースは不要
  const remainingSpace = totalHeight - usedHeight
  const spacing = Math.max(minSpacing, Math.floor(remainingSpace / 4))

  // 各ゾーンのY座標
  const zone1Y = 0 // タイトル1（最上部）
  const zone2Y = zone1Y + titleHeight + spacing // カードグリッド1
  const zone3Y = zone2Y + layout1.totalHeight + spacing // タイトル2
  const zone4Y = zone3Y + titleHeight + spacing // カードグリッド2

  console.log(`[calculateUniformSpacing] ========================================`)
  console.log(`[calculateUniformSpacing] Cards1: ${cards1Count}, Cards2: ${cards2Count}`)
  console.log(`[calculateUniformSpacing] Optimal cardSize: ${optimalCardSize}px`)
  console.log(
    `[calculateUniformSpacing] Layout1: ${layout1.cols}×${layout1.rows}, totalHeight: ${layout1.totalHeight}px`,
  )
  console.log(
    `[calculateUniformSpacing] Layout2: ${layout2.cols}×${layout2.rows}, totalHeight: ${layout2.totalHeight}px`,
  )
  console.log(`[calculateUniformSpacing] Zone spacing: ${spacing}px`)
  console.log(`[calculateUniformSpacing] Zone1Y (Title1): ${zone1Y}px`)
  console.log(`[calculateUniformSpacing] Zone2Y (Cards1): ${zone2Y}px`)
  console.log(`[calculateUniformSpacing] Zone3Y (Title2): ${zone3Y}px`)
  console.log(`[calculateUniformSpacing] Zone4Y (Cards2): ${zone4Y}px`)
  console.log(`[calculateUniformSpacing] ========================================`)

  return {
    spacing,
    zone1Y,
    zone2Y,
    zone3Y,
    zone4Y,
    zone2Height: layout1.totalHeight,
    zone4Height: layout2.totalHeight,
    optimalCardSize,
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
    const x = startX + col * (layout.cardSize + layout.spacing)
    const y = startY + row * (layout.cardSize + layout.spacing)
    positions.push({ x, y })
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
