import Image from "next/image"
import Link from "next/link"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { notFound } from "next/navigation"
import { getInfoPageById } from "@/lib/actions/info-pages"
import { getInfoDetailById } from "@/lib/actions/info-articles"
import CardDisplay from "@/components/card-display"
import RenderArticle from "@/components/info/render-article"
import PickupInfo from "@/components/pickup-info"

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const hh = String(d.getHours()).padStart(2, "0")
    const mi = String(d.getMinutes()).padStart(2, "0")
    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
  } catch {
    return ""
  }
}

type NormalizedCard = {
  card_id: number
  name: string
  quantity: number
  image_url?: string
  thumb_url?: string
}

function normalizeCardsData(raw: any): NormalizedCard[] {
  try {
    const base = Array.isArray(raw) ? raw : typeof raw === "string" ? JSON.parse(raw) : []
    if (!Array.isArray(base)) return []

    const rows: NormalizedCard[] = base
      .filter((c: any) => Number.isFinite(Number(c?.card_id)) && Number(c?.card_id) > 0)
      .map((c: any) => {
        const qty = Number.isFinite(Number(c?.quantity))
          ? Number(c.quantity)
          : Number.isFinite(Number(c?.card_count))
            ? Number(c.card_count)
            : 1
        return {
          card_id: Number(c.card_id),
          name: String(c.name ?? "不明なカード"),
          quantity: Math.max(1, qty),
          image_url: typeof c.image_url === "string" ? c.image_url : undefined,
          thumb_url:
            (typeof c.thumb_url === "string" ? c.thumb_url : undefined) ||
            (typeof c.image_url === "string" ? c.image_url : undefined),
        }
      })

    // aggregate by card_id
    const map = new Map<number, NormalizedCard>()
    for (const r of rows) {
      const prev = map.get(r.card_id)
      if (prev) {
        prev.quantity += r.quantity
      } else {
        map.set(r.card_id, { ...r })
      }
    }
    return Array.from(map.values())
  } catch {
    return []
  }
}

interface InfoDetailPageProps {
  params: {
    id: string
  }
}

export default async function InfoDetailPage({ params }: InfoDetailPageProps) {
  // Fetch new info_articles data. If unavailable, surface 404 gracefully.
  let meta: any
  let blocks: any[] = []
  try {
    const res = await getInfoDetailById(params.id)
    meta = res.meta
    blocks = res.blocks
  } catch {
    // If not found or blocked by RLS (unpublished), return 404
    notFound()
  }
  if (!meta) {
    notFound()
  }

  const pageTitle = String(meta.title ?? "")
  const updatedAt = formatDateTime(meta.updated_at ?? meta.published_at)

  // Detect if blocks contain H1; if not, show pageTitle as top H1 for consistency
  const hasH1 = Array.isArray(blocks) && blocks.some((b) => b?.type === "heading" && b?.data?.level === 1)

  // Fetch existing info_page data for comparison or additional content
  const result = await getInfoPageById(params.id)
  const page = result?.data ?? {}

  const creator = "-" // deck_pages互換のスキーマには作成者がないため、現状はダッシュ表記
  const category = (meta.category as string | null) ?? (meta.tier_name as string | null) ?? null
  const hero = (meta.thumbnail_image_url as string) || "/placeholder.svg?height=400&width=800"
  const intro = String(meta.deck_description ?? "この記事の概要は準備中です。")

  // ピックアップ情報: strengths_weaknesses_list から最大3件を使用（なければプレースホルダー）
  const pickups: string[] =
    Array.isArray(meta.strengths_weaknesses_list) && meta.strengths_weaknesses_list.length > 0
      ? meta.strengths_weaknesses_list.slice(0, 3)
      : ["ポイント1（プレースホルダー）", "ポイント2（プレースホルダー）", "ポイント3（プレースホルダー）"]

  // 主要カードテーブル用に整形
  const cards: NormalizedCard[] = normalizeCardsData(meta.cards_data ?? meta.deck_cards)
  const energyType = String(meta.energy_type ?? "基本エネルギー")
  const energyCountGuess = cards
    .filter((c) => c.name.includes("エネルギー") || (energyType && c.name.includes(energyType)))
    .reduce((sum, c) => sum + (Number.isFinite(c.quantity) ? c.quantity : 0), 0)

  // 評価関連
  const tierRank = String(meta.tier_rank ?? "")
  const tierName = String(meta.tier_name ?? "")
  const evalValue =
    typeof meta.eval_value === "number"
      ? meta.eval_value
      : Number.isFinite(Number(meta.eval_value))
        ? Number(meta.eval_value)
        : 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1" style={{ background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <article className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
            {/* タイトル行 */}
            <header className="space-y-2">
              {!hasH1 && <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{pageTitle || "最新情報"}</h1>}
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                {meta.category ? (
                  <>
                    <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {meta.category}
                    </span>
                    <span className="text-slate-400">/</span>
                  </>
                ) : null}
                {Array.isArray(meta.tags) && meta.tags[0] ? (
                  <>
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {meta.tags[0]}
                    </span>
                    <span className="text-slate-400">/</span>
                  </>
                ) : null}
                <span>{`更新：${updatedAt || "-"}`}</span>
              </div>
            </header>

            {/* ピックアップ情報 - blocksからpickupタイプを検索 */}
            {(() => {
              const pickupBlock = blocks.find((block) => block.type === "pickup")
              if (pickupBlock && pickupBlock.data.items && pickupBlock.data.items.length > 0) {
                return <PickupInfo items={pickupBlock.data.items.map((item) => item.label)} />
              }
              return null
            })()}

            {/* バナー＋導入文 - blocksからimageタイプを検索 */}
            <section className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
              <div className="relative w-full aspect-[16/9] bg-slate-100">
                <Image
                  src={(() => {
                    const imageBlock = blocks.find((block) => block.type === "image")
                    return imageBlock?.data.url || meta.thumbnail_image_url || "/placeholder.svg"
                  })()}
                  alt={`${meta.deck_name ?? "デッキ"} バナー画像`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1024px"
                  priority
                />
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-slate-800">
                  {(() => {
                    const paragraphBlock = blocks.find((block) => block.type === "paragraph")
                    return paragraphBlock?.data.text || intro
                  })()}
                </p>
              </div>
            </section>

            {/* 目次 */}
            {/* Placeholder for table of contents if needed */}

            {/* 〇〇デッキのレシピ */}
            {Array.isArray(cards) && cards.length > 0 && (
              <section
                id="〇〇デッキのレシピ"
                className="rounded-xl bg-white/90 p-4 sm:p-6 ring-1 ring-slate-200 space-y-4"
              >
                <h2 className="text-lg font-semibold text-slate-900">〇〇デッキのレシピ</h2>

                {/* デッキ名/ポイント 表 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-slate-200">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-3 py-2 border-b border-slate-200 text-left w-40">デッキ名</th>
                        <th className="px-3 py-2 border-b border-slate-200 text-left">デッキのポイント</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 align-top font-semibold">{meta.deck_name ?? "〇〇デッキ"}</td>
                        <td className="px-3 py-2 align-top">
                          <ul className="list-disc pl-5 space-y-1">
                            {(Array.isArray(meta.tier_descriptions) && meta.tier_descriptions.length > 0
                              ? meta.tier_descriptions.slice(0, 3)
                              : ["〇〇に特化", "後攻2T目に〇〇", "〇〇でドロー加速"]
                            ).map((pt: string, i: number) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 主要カード 表 */}
                <div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">デッキレシピ（主要カード）</h3>
                  <div className="overflow-x-auto mt-2">
                    <table className="min-w-full text-sm border border-slate-200">
                      <thead className="bg-slate-50 text-slate-700">
                        <tr>
                          <th className="px-3 py-2 border-b border-slate-200 text-left">カード</th>
                          <th className="px-3 py-2 border-b border-slate-200 text-center w-24">枚数</th>
                          <th className="px-3 py-2 border-b border-slate-200 text-center w-28">画像</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cards.slice(0, 12).map((c) => (
                          <tr key={c.card_id} className="odd:bg-white even:bg-slate-50">
                            <td className="px-3 py-2">{c.name}</td>
                            <td className="px-3 py-2 text-center">{`×${c.quantity}`}</td>
                            <td className="px-3 py-2">
                              <div className="mx-auto w-[54px] aspect-[5/7] rounded border border-slate-200 overflow-hidden bg-slate-100">
                                {/* CardDisplay expects a valid numeric ID; we already filtered invalid IDs */}
                                <CardDisplay cardId={c.card_id} useThumb fill objectFit="cover" />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {cards.length === 0 && (
                          <tr>
                            <td className="px-3 py-2 text-slate-600" colSpan={3}>
                              主要カード情報は未設定です。
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* エネルギー */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-900">エネルギー</h4>
                    <ul className="mt-1 list-disc pl-5 text-slate-800">
                      <li>{`⚡ ${energyType} ×${energyCountGuess > 0 ? energyCountGuess : "N"}`}</li>
                      <li>🟡 追加エネルギー ×N</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* デッキの概要 - blocksからcalloutタイプまたはparagraphタイプを検索 */}
            {(() => {
              const overviewBlock = blocks.find(
                (block) =>
                  (block.type === "callout" && block.data.title?.includes("概要")) ||
                  (block.type === "paragraph" && block.data.text?.includes("概要")),
              )

              if (!overviewBlock) return null

              const overviewText = overviewBlock.data.text || overviewBlock.data.title

              return (
                <section id="デッキの概要" className="rounded-xl bg-white/90 p-4 sm:p-6 ring-1 ring-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">デッキの概要</h2>
                  <blockquote className="mt-2 border-l-4 border-blue-300 pl-4 text-slate-800">
                    {overviewText}
                  </blockquote>
                </section>
              )
            })()}

            {/* 〇〇デッキのコード */}
            {/* Placeholder for deck code section if needed */}

            {/* 〇〇デッキの評価 */}
            {Array.isArray(blocks) && blocks.some((b) => b?.type === "eval") && (
              <section id="〇〇デッキの評価" className="rounded-xl bg-white/90 p-4 sm:p-6 ring-1 ring-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">〇〇デッキの評価</h2>
                <div className="mt-2 overflow-x-auto">
                  <table className="min-w-[420px] text-sm border border-slate-200">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-3 py-2 border-b border-slate-200 text-left w-40">指標</th>
                        <th className="px-3 py-2 border-b border-slate-200 text-center">値</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2">TIER</td>
                        <td className="px-3 py-2 text-center font-semibold">{`TIER ${tierRank || "X"}`}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">最大ダメ</td>
                        <td className="px-3 py-2 text-center font-semibold">{meta.max_damage ?? "NN"}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">構築難度</td>
                        <td className="px-3 py-2 text-center">{meta.build_difficulty ?? "低/中/高"}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">使いやすさ</td>
                        <td className="px-3 py-2 text-center">{meta.stat_accessibility ?? "低/中/高"}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">安定度</td>
                        <td className="px-3 py-2 text-center">{meta.stat_stability ?? "低/中/高"}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">総合評価</td>
                        <td className="px-3 py-2 text-center font-semibold">
                          {Number.isFinite(evalValue) ? evalValue.toFixed(2) : "0.00"}{" "}
                          <span className="text-slate-500 text-xs">({meta.eval_count ?? 0})</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* 立ち回り（序盤/中盤/終盤） */}
            {/* Placeholder for stage-by-stage play section if needed */}

            {/* 相性・対策 */}
            {/* Placeholder for matchup and strategy section if needed */}

            {/* Render Article Blocks - display_orderに従って表示 */}
            <div className="prose prose-slate max-w-none">
              <RenderArticle blocks={blocks} />
            </div>

            {/* 戻るリンク */}
            <div className="mt-4">
              <Link href="/info" className="text-blue-600 hover:underline text-sm">
                最新情報一覧へ
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
