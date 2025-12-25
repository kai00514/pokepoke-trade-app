import type { Metadata } from "next"
import { getTradePostDetailsById } from "@/lib/actions/trade-actions"
import TradeDetailClient from "@/components/trade-detail-client"
import TradeDetail404 from "@/components/trade-detail-404"
import { getTranslations } from "next-intl/server"

// OGPメタデータの生成（Server Componentでのみ動作）
export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }): Promise<Metadata> {
  const t = await getTranslations()
  const tCommon = await getTranslations('common.labels')
  const { id, locale } = await params

  // "create"ページの場合は通常のメタデータを返す
  if (id === "create") {
    return {
      title: `${t('trades.createPost')} | PokeLink`,
      description: t('trades.createPostDescription'),
    }
  }

  // 投稿データを取得
  const result = await getTradePostDetailsById(id, locale)

  if (!result.success || !result.post) {
    return {
      title: `${t('errors.data.postNotFound')} | PokeLink`,
      description: t('errors.data.postNotFoundDescription'),
    }
  }

  const post = result.post

  // カード名のリストを作成
  const wantedCardNames = post.wantedCards.map((card) => card.name).join("、") || tCommon('negotiable')
  const offeredCardNames = post.offeredCards.map((card) => card.name).join("、") || tCommon('negotiable')

  // OG画像は opengraph-image.tsx が生成する
  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"}/trades/${id}/opengraph-image`

  return {
    title: `${post.title} | PokeLink`,
    description: `${t('trades.wantedCards')}: ${wantedCardNames} / ${t('trades.offeredCards')}: ${offeredCardNames}`,
    openGraph: {
      title: post.title,
      description: `${t('trades.wantedCards')}: ${wantedCardNames} / ${t('trades.offeredCards')}: ${offeredCardNames}`,
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
      description: `${t('trades.wantedCards')}: ${wantedCardNames} / ${t('trades.offeredCards')}: ${offeredCardNames}`,
      images: [ogImageUrl],
    },
  }
}

// Server Component（asyncが使える）
export default async function TradeDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const t = await getTranslations()
  const { id, locale } = await params

  // "create"ページへのアクセスは404を返す（createページは別ルート）
  if (id === "create") {
    return <TradeDetail404 message={t('errors.data.postDoesNotExist')} />
  }

  // サーバー側で投稿データを取得
  const result = await getTradePostDetailsById(id, locale)

  // データが取得できない場合はカスタム404を表示
  if (!result.success || !result.post) {
    return <TradeDetail404 message={t('errors.data.postNotFound')} />
  }

  // Client Componentに初期データを渡して表示
  return <TradeDetailClient initialPost={result.post} postId={id} />
}
