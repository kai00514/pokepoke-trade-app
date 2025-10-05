import type { Metadata } from "next"
import { getTradePostDetailsById } from "@/lib/actions/trade-actions"
import TradeDetailClient from "@/components/trade-detail-client"
import TradeDetail404 from "@/components/trade-detail-404"

// OGPメタデータの生成（Server Componentでのみ動作）
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params

  // "create"ページの場合は通常のメタデータを返す
  if (id === "create") {
    return {
      title: "トレード投稿作成 | PokeLink",
      description: "新しいトレード投稿を作成します",
    }
  }

  // 投稿データを取得
  const result = await getTradePostDetailsById(id)

  if (!result.success || !result.post) {
    return {
      title: "投稿が見つかりません | PokeLink",
      description: "お探しの投稿は見つかりませんでした",
    }
  }

  const post = result.post

  // カード名のリストを作成
  const wantedCardNames = post.wantedCards.map((card) => card.name).join("、") || "要相談"
  const offeredCardNames = post.offeredCards.map((card) => card.name).join("、") || "要相談"

  // OG画像は opengraph-image.tsx が生成する
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"}/trades/${id}/opengraph-image`

  return {
    title: `${post.title} | PokeLink`,
    description: `求めるカード: ${wantedCardNames} / 譲りたいカード: ${offeredCardNames}`,
    openGraph: {
      title: post.title,
      description: `求めるカード: ${wantedCardNames} / 譲りたいカード: ${offeredCardNames}`,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"}/trades/${id}`,
      siteName: "PokeLink",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: "ja_JP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: `求めるカード: ${wantedCardNames} / 譲りたいカード: ${offeredCardNames}`,
      images: [ogImageUrl],
    },
  }
}

// Server Component（asyncが使える）
export default async function TradeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params

  // "create"ページへのアクセスは404を返す（createページは別ルート）
  if (id === "create") {
    return <TradeDetail404 message="この投稿は存在しません" />
  }

  // サーバー側で投稿データを取得
  const result = await getTradePostDetailsById(id)

  // データが取得できない場合はカスタム404を表示
  if (!result.success || !result.post) {
    return <TradeDetail404 message="投稿が見つかりません" />
  }

  // Client Componentに初期データを渡して表示
  return <TradeDetailClient initialPost={result.post} postId={id} />
}
