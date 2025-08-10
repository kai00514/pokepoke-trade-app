export type NewsArticle = {
  id: string
  title: string
  date: string // ISO date string
  summary: string
  category: string
  categoryColor?: string
  url: string
  imageUrl: string
}

const PLACEHOLDER = "/placeholder.svg?height=360&width=640"

const NEWS: NewsArticle[] = [
  {
    id: "news-2025-06-15-spacetime",
    title: "新パック『時空の創造者』発売開始！伝説のポケモンたちが集結",
    date: "2025-06-15",
    summary:
      "待望の新カードパックが本日より全国の販売店で発売開始。新たな戦略と強力なカードでデッキを強化しよう！注目のカードをチェック！",
    category: "新製品",
    categoryColor: "emerald",
    url: "/news/new-pack-spacetime-creator",
    imageUrl: PLACEHOLDER,
  },
  {
    id: "news-2025-06-10-app-250",
    title: "アプリバージョン2.5.0リリースのお知らせ",
    date: "2025-06-10",
    summary: "新機能の追加と既存の不具合修正を含む大型アップデートが公開されました。",
    category: "アプリ",
    categoryColor: "sky",
    url: "/news/app-update-2-5-0",
    imageUrl: PLACEHOLDER,
  },
  {
    id: "news-2025-06-05-rule-update",
    title: "公式ルール改定のお知らせ：2025年7月版",
    date: "2025-06-05",
    summary: "7月1日より適用される新ルールについての詳細が発表されました。大会参加予定の方は必ずご確認ください。",
    category: "ルール",
    categoryColor: "amber",
    url: "/news/rule-update-july-2025",
    imageUrl: PLACEHOLDER,
  },
  {
    id: "news-2025-06-02-event-summer",
    title: "夏の公式イベント開催決定！特別プロモカードも登場",
    date: "2025-06-02",
    summary: "夏に向けて全国で開催される公式イベントのスケジュールが公開されました。",
    category: "イベント",
    categoryColor: "rose",
    url: "/news/summer-events-2025",
    imageUrl: PLACEHOLDER,
  },
  {
    id: "news-2025-05-28-meta-report",
    title: "最新メタレポート：環境トップデッキ分析",
    date: "2025-05-28",
    summary: "直近の大会結果から見る環境トップデッキを徹底分析。注目カードと対策を紹介。",
    category: "分析",
    categoryColor: "violet",
    url: "/news/meta-report-2025-05",
    imageUrl: PLACEHOLDER,
  },
  {
    id: "news-2025-05-22-collab",
    title: "人気ブランドとのコラボ商品が登場",
    date: "2025-05-22",
    summary: "数量限定のコラボグッズが登場。販売日や入手方法をチェック！",
    category: "コラボ",
    categoryColor: "emerald",
    url: "/news/collab-2025-05",
    imageUrl: PLACEHOLDER,
  },
  {
    id: "news-2025-05-15-store-campaign",
    title: "ショップキャンペーン開始！参加で限定アイテムをゲット",
    date: "2025-05-15",
    summary: "対象店舗での購入・対戦で限定アイテムが手に入るキャンペーンがスタート。",
    category: "キャンペーン",
    categoryColor: "sky",
    url: "/news/store-campaign-2025-05",
    imageUrl: PLACEHOLDER,
  },
  {
    id: "news-2025-05-08-balance",
    title: "バランス調整に関する事前告知",
    date: "2025-05-08",
    summary: "一部カードの調整予定が告知されました。詳細は後日公開予定です。",
    category: "お知らせ",
    categoryColor: "amber",
    url: "/news/balance-announcement-2025-05",
    imageUrl: PLACEHOLDER,
  },
]

export function getAllNews(): NewsArticle[] {
  return [...NEWS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getLatestNews(count = 5): NewsArticle[] {
  return getAllNews().slice(0, count)
}
