/**
 * コラージュ画像レイアウトコンポーネント
 * ImageResponseで画像生成するためのレイアウト
 */

interface CardData {
  id: number
  name: string
  imageUrl: string
}

interface CollageLayoutProps {
  title1: string
  title2: string
  cards1DataUrls: string[]
  cards2DataUrls: string[]
  cardSize?: number
  gap?: number // カード間のスペース（ピクセル）
}

/**
 * カード枚数から最適なカードサイズを計算
 */
function calculateOptimalCardSize(cards1Count: number, cards2Count: number): number {
  const maxCards = Math.max(cards1Count, cards2Count)

  if (maxCards <= 6) return 200
  if (maxCards <= 9) return 160
  if (maxCards <= 12) return 140
  if (maxCards <= 16) return 120
  if (maxCards <= 20) return 110
  if (maxCards <= 25) return 100
  return 90
}

export function CollageLayout({
  title1,
  title2,
  cards1DataUrls,
  cards2DataUrls,
  cardSize: customCardSize,
  gap = 0, // デフォルトは0px（スペースなし）
}: CollageLayoutProps) {
  const cardSize = customCardSize || calculateOptimalCardSize(cards1DataUrls.length, cards2DataUrls.length)

  return (
    <div
      style={{
        width: 1536,
        height: 1024,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(to bottom right, rgb(250, 245, 255), rgb(237, 233, 254))',
        position: 'relative',
      }}
    >
      {/* タイトル1セクション */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 60,
          background: 'rgb(236, 72, 153)',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {title1}
        </h1>
      </div>

      {/* カードグリッド1 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: gap,
          padding: 20,
          justifyContent: 'center',
          alignItems: 'flex-start',
          flex: 1,
        }}
      >
        {cards1DataUrls.map((dataUrl, index) => (
          <img
            key={`card1-${index}`}
            src={dataUrl}
            alt={`Card ${index + 1}`}
            width={cardSize}
            height={cardSize}
            style={{
              objectFit: 'cover',
              borderRadius: 8,
            }}
          />
        ))}
      </div>

      {/* タイトル2セクション */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 60,
          background: 'rgb(59, 130, 246)',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: 48,
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {title2}
        </h1>
      </div>

      {/* カードグリッド2 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: gap,
          padding: 20,
          justifyContent: 'center',
          alignItems: 'flex-start',
          flex: 1,
        }}
      >
        {cards2DataUrls.map((dataUrl, index) => (
          <img
            key={`card2-${index}`}
            src={dataUrl}
            alt={`Card ${index + 1}`}
            width={cardSize}
            height={cardSize}
            style={{
              objectFit: 'cover',
              borderRadius: 8,
            }}
          />
        ))}
      </div>
    </div>
  )
}
