import { join } from "path"
import { readFileSync } from "fs"
import { ImageResponse } from "@vercel/og"

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
}

interface GenerateCollageImageParams {
  collageId: string
  title1: string
  title2: string
  cards1: CardData[]
  cards2: CardData[]
}

/**
 * 日本語フォントを読み込み
 */
function loadJapaneseFont(): ArrayBuffer {
  const fontPath = join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.ttf")
  const fontBuffer = readFileSync(fontPath)
  return fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength)
}

/**
 * カード配置を計算
 */
function calculateCardLayout(cardCount: number, cols: number) {
  const rows = Math.ceil(cardCount / cols)
  const cardWidth = CANVAS_WIDTH / cols
  const cardHeight = cardWidth / CARD_ASPECT_RATIO
  const sectionHeight = cardHeight * rows

  return { rows, cardWidth, cardHeight, sectionHeight }
}

/**
 * コラージュ画像を生成してBufferとして返す（1536x1024px）
 */
export async function generateCollageImageBuffer(params: GenerateCollageImageParams): Promise<Buffer> {
  const { title1, title2, cards1, cards2 } = params

  console.log("=".repeat(60))
  console.log("[v0] コラージュ画像生成開始 (@vercel/og)")
  console.log(`[v0] 求めるカード: ${cards1.length}枚`)
  console.log(`[v0] 譲れるカード: ${cards2.length}枚`)
  console.log("=".repeat(60))

  const japaneseFont = loadJapaneseFont()

  const layout1 = calculateCardLayout(cards1.length, COLS)
  const layout2 = calculateCardLayout(cards2.length, COLS)

  const section1Y = TITLE_HEIGHT
  const title2Y = TITLE_HEIGHT + layout1.sectionHeight
  const section2Y = title2Y + TITLE_HEIGHT

  const imageResponse = new ImageResponse(
    <div
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundImage: "url(https://www.pokelnk.com/coragu_backimage.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Title 1 */}
      <div
        style={{
          width: "100%",
          height: TITLE_HEIGHT,
          backgroundColor: "rgb(236, 72, 153)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: "white",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            fontFamily: "NotoSansJP",
          }}
        >
          {title1}
        </div>
      </div>

      {/* Cards 1 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: "100%",
          height: layout1.sectionHeight,
        }}
      >
        {cards1.map((card, index) => (
          <img
            key={`card1-${index}`}
            src={card.imageUrl || "/placeholder.svg"}
            style={{
              width: layout1.cardWidth,
              height: layout1.cardHeight,
              objectFit: "contain",
            }}
          />
        ))}
      </div>

      {/* Title 2 */}
      <div
        style={{
          width: "100%",
          height: TITLE_HEIGHT,
          backgroundColor: "rgb(59, 130, 246)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: "white",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            fontFamily: "NotoSansJP",
          }}
        >
          {title2}
        </div>
      </div>

      {/* Cards 2 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: "100%",
          height: layout2.sectionHeight,
        }}
      >
        {cards2.map((card, index) => (
          <img
            key={`card2-${index}`}
            src={card.imageUrl || "/placeholder.svg"}
            style={{
              width: layout2.cardWidth,
              height: layout2.cardHeight,
              objectFit: "contain",
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          width: "100%",
          height: FOOTER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          bottom: 0,
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: "rgba(0,0,0,0.6)",
            fontFamily: "NotoSansJP",
          }}
        >
          ポケポケコラージュ画像メーカー@PokeLink
        </div>
      </div>
    </div>,
    {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      fonts: [
        {
          name: "NotoSansJP",
          data: japaneseFont,
          style: "normal",
          weight: 400,
        },
      ],
    },
  )

  const arrayBuffer = await imageResponse.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  console.log("[v0] ✅ コラージュ画像生成完了！")
  console.log(`[v0] ファイルサイズ: ${(buffer.length / 1024).toFixed(2)} KB`)

  return buffer
}
