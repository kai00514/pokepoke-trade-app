"use client"

import Link from "next/link"
import Image from "next/image"
import React from "react"
import { ChevronRight, List, AlertCircle, CheckCircle, Info } from "lucide-react"
import type { Block } from "@/lib/actions/info-articles"
import type { JSX } from "react"
import { createClient } from "@supabase/supabase-js"

interface RenderArticleProps {
  blocks: Block[]
}

function createSafeAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50)
}

function renderHeading(block: Block & { type: "heading" }) {
  const { level, text, anchorId } = block.data
  const id = anchorId || createSafeAnchorId(text)

  if (level === 2) {
    return (
      <div className="relative my-5">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-3 py-[5px] rounded-lg shadow-lg border-l-4 border-blue-500">
          <h2 className="m-0 text-lg font-bold text-white leading-loose">{text}</h2>
        </div>
        <div id={id} className="absolute -top-16"></div>
      </div>
    )
  }

  if (level === 3) {
    return (
      <div className="relative my-5">
        <div className="bg-gradient-to-r from-slate-600 to-slate-500 text-white px-3 py-[5px] rounded-md shadow-md border-l-4 border-green-500">
          <h3 className="m-0 text-lg font-semibold text-white leading-snug">{text}</h3>
        </div>
        <div id={id} className="absolute -top-20"></div>
      </div>
    )
  }

  // H1 fallback
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  return (
    <Tag id={id} className="text-2xl font-bold text-slate-900 mt-4 mb-2">
      {text}
    </Tag>
  )
}

function renderToc(blocks: Block[]) {
  const headings = blocks
    .filter((b): b is Block & { type: "heading" } => b.type === "heading")
    .filter((b) => b.data.level === 2 || b.data.level === 3)

  if (headings.length === 0) {
    return null
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mt-1 mb-2 py-0">
      <div className="border-l-4 border-yellow-400 bg-white">
        <div className="flex items-center gap-1 px-4 py-1 border-b border-slate-200 leading-none">
          <span className="flex items-center justify-center h-4 w-4">
            <List className="w-4 h-4 text-slate-600 relative top-[1px]" />
          </span>
          <h3 className="font-semibold text-slate-900 text-sm leading-tight">目次</h3>
        </div>
        <nav className="px-4 py-0">
          <ul className="list-disc list-outside marker:text-black pl-4 leading-none">
            {headings.map((heading, index) => {
              const id = heading.data.anchorId || createSafeAnchorId(heading.data.text)
              const isH3 = heading.data.level === 3
              return (
                <li
                  key={index}
                  className={`${isH3 ? "ml-4" : ""} border-b border-gray-200 last:border-b-0 py-0 leading-tight`}
                >
                  <Link
                    href={`#${id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm leading-none py-0"
                  >
                    {heading.data.text}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}

function renderTable(block: Block & { type: "table" }) {
  const { headers, rows } = block.data

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm my-2 leading-snug py-1">
      <table className="w-full border-collapse border border-slate-200 leading-snug">
        {headers && headers.length > 0 && (
          <thead>
            <tr className="bg-blue-100 leading-snug">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-1 text-left text-sm font-semibold text-slate-700 border-b border-slate-200 border-r border-slate-200 last:border-r-0 leading-snug"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-1 text-sm text-slate-600 border-b border-slate-100 border-r border-slate-200 last:border-r-0 leading-snug"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderCallout(block: Block & { type: "callout" }) {
  const { tone, text, title } = block.data

  const styles = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />,
      textColor: "text-blue-800",
      label: "情報",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />,
      textColor: "text-yellow-800",
      label: "警告",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />,
      textColor: "text-green-800",
      label: "成功",
    },
  }

  const style = styles[tone || "info"]

  return (
    <div className={`my-2 px-2 py-1 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-2">
        {style.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm">{title || style.label}</span>
          </div>
          <p className={`text-sm ${style.textColor} leading-relaxed`}>{text}</p>
        </div>
      </div>
    </div>
  )
}

function renderRichText(block: Block & { type: "rich-text" }) {
  const { content, format, style } = block.data

  if (format === "markdown") {
    // 簡単なMarkdownレンダリング
    const htmlContent = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-sm'>$1</code>")
      .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold text-slate-900 mt-4 mb-2'>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold text-slate-900 mt-6 mb-3'>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold text-slate-900 mt-8 mb-4'>$1</h1>")
      .replace(
        /^> (.+)$/gm,
        "<blockquote class='border-l-4 border-slate-300 pl-4 italic text-slate-600'>$1</blockquote>",
      )
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul class='list-disc list-inside space-y-1'>$1</ul>")
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      .replace(/\[([^\]]+)\]$$([^)]+)$$/g, "<a href='$2' class='text-blue-600 hover:underline'>$1</a>")
      .replace(/!\[([^\]]*)\]$$([^)]+)$$/g, "<img src='$2' alt='$1' class='max-w-full h-auto rounded' />")
      .replace(/\n\n/g, "</p><p class='mb-4'>")
      .replace(/\n/g, "<br>")

    return (
      <div
        className="prose prose-slate max-w-none my-2"
        style={{
          fontSize: style?.fontSize,
          color: style?.color,
          backgroundColor: style?.backgroundColor,
          textAlign: style?.textAlign,
        }}
        dangerouslySetInnerHTML={{ __html: `<p class='mb-4'>${htmlContent}</p>` }}
      />
    )
  }

  if (format === "html") {
    return (
      <div
        className="prose prose-slate max-w-none my-2"
        style={{
          fontSize: style?.fontSize,
          color: style?.color,
          backgroundColor: style?.backgroundColor,
          textAlign: style?.textAlign,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  // プレーンテキスト
  return (
    <div
      className="whitespace-pre-wrap my-2"
      style={{
        fontSize: style?.fontSize,
        color: style?.color,
        backgroundColor: style?.backgroundColor,
        textAlign: style?.textAlign,
      }}
    >
      {content}
    </div>
  )
}

function CardDisplayTable({
  rows,
}: {
  rows: Array<{ id: string; header: string; cards: Array<{ id: string; name: string; imageUrl: string }> }>
}) {
  const [cards, setCards] = React.useState<
    Array<{ id: number; name: string; image_url: string; thumb_url?: string; game8_image_url?: string }>
  >([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchCards() {
      try {
        setLoading(true)
        setError(null)

        // 環境変数の確認
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
          console.error("Supabase環境変数が設定されていません")
          setError("データベース接続エラー")
          return
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 全てのカードIDを収集
        const allCardIds = rows.flatMap((row) =>
          row.cards
            .map((card) => {
              const cardId = Number.parseInt(card.id, 10)
              return !isNaN(cardId) ? cardId : null
            })
            .filter((id): id is number => id !== null),
        )

        console.log("取得するカードID:", allCardIds)

        if (allCardIds.length === 0) {
          console.log("カードIDが見つかりません")
          setCards([])
          return
        }

        // データベースからカード情報を取得
        const { data, error: fetchError } = await supabase
          .from("cards")
          .select("id, name, image_url, thumb_url, game8_image_url")
          .in("id", allCardIds)

        if (fetchError) {
          console.error("カード取得エラー:", fetchError)
          setError("カード情報の取得に失敗しました")
          return
        }

        console.log("取得したカードデータ:", data)
        setCards(data || [])
      } catch (error) {
        console.error("カード取得中にエラーが発生:", error)
        setError("予期しないエラーが発生しました")
      } finally {
        setLoading(false)
      }
    }

    if (rows && rows.length > 0) {
      fetchCards()
    } else {
      setLoading(false)
    }
  }, [rows])

  const getCardImageUrl = (card: { id: string; name: string; imageUrl: string }) => {
    // 1. まず、管理画面で設定されたimageUrlを確認
    if (card.imageUrl && card.imageUrl !== "") {
      console.log(`カード${card.id}の管理画面設定URL:`, card.imageUrl)
      return card.imageUrl
    }

    // 2. データベースから取得したカード情報を確認
    const numericCardId = Number.parseInt(card.id, 10)
    if (!isNaN(numericCardId)) {
      const dbCard = cards.find((c) => c.id === numericCardId)
      if (dbCard) {
        // 優先順位: game8_image_url > image_url
        if (dbCard.game8_image_url) {
          console.log(`カード${card.id}のgame8 URL:`, dbCard.game8_image_url)
          return dbCard.game8_image_url
        }
        if (dbCard.image_url) {
          console.log(`カード${card.id}のimage URL:`, dbCard.image_url)
          return dbCard.image_url
        }
      }
    }

    // 3. フォールバック
    console.log(`カード${card.id}はプレースホルダーを使用`)
    return "/placeholder.svg?height=280&width=200&text=Card"
  }

  const getCardName = (card: { id: string; name: string; imageUrl: string }) => {
    // 1. 管理画面で設定された名前
    if (card.name && card.name !== "") {
      return card.name
    }

    // 2. データベースから取得した名前
    const numericCardId = Number.parseInt(card.id, 10)
    if (!isNaN(numericCardId)) {
      const dbCard = cards.find((c) => c.id === numericCardId)
      if (dbCard && dbCard.name) {
        return dbCard.name
      }
    }

    // 3. フォールバック
    return `Card ${card.id}`
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden p-4">
        <div className="text-center text-slate-500">カード情報を読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden p-4">
        <div className="text-center text-red-500">エラー: {error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden my-4">
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              <td className="px-4 py-4 text-sm font-semibold text-slate-700 border-b border-slate-200 bg-slate-100 align-top whitespace-nowrap">
                {row.header}
              </td>
              <td className="px-4 py-4 border-b border-slate-200 w-full">
                {row.cards.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {row.cards.map((card, cardIndex) => {
                      const imageUrl = getCardImageUrl(card)
                      const cardName = getCardName(card)

                      return (
                        <div key={`${card.id}-${cardIndex}`} className="flex flex-col items-center">
                          <div className="aspect-[5/7] relative rounded border overflow-hidden bg-slate-100 w-full max-w-[80px]">
                            <Image
                              src={imageUrl || "/placeholder.svg"}
                              alt={cardName}
                              fill
                              className="object-cover"
                              sizes="80px"
                              onError={(e) => {
                                console.error(`画像読み込みエラー (${card.id}):`, imageUrl)
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=280&width=200&text=Error"
                              }}
                              onLoad={() => {
                                console.log(`画像読み込み成功 (${card.id}):`, imageUrl)
                              }}
                            />
                          </div>
                          <div className="mt-1 text-[10px] text-slate-600 text-center truncate w-full max-w-[80px]">
                            {cardName}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm">カードが選択されていません</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CardsTable({
  items,
  headers,
}: {
  items: Array<{ id?: string; card_id: number; explanation?: string; quantity: number | string }>
  headers?: { id?: string; card?: string; explanation?: string; quantity?: string }
}) {
  const [cards, setCards] = React.useState<
    Array<{ id: number; name: string; image_url: string; thumb_url?: string; game8_image_url?: string }>
  >([])
  const [loading, setLoading] = React.useState(true)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  React.useEffect(() => {
    async function fetchCards() {
      try {
        const cardIds = items.map((item) => item.card_id)
        const { data } = await supabase
          .from("cards")
          .select("id, name, image_url, thumb_url, game8_image_url")
          .in("id", cardIds)
        setCards(data || [])
      } catch (error) {
        console.error("Failed to fetch cards:", error)
      } finally {
        setLoading(false)
      }
    }

    if (items.length > 0) {
      fetchCards()
    } else {
      setLoading(false)
    }
  }, [items, supabase])

  // カードの画像URLを取得する関数
  const getCardImageUrl = (cardId: number, useThumb = false) => {
    const card = cards.find((c) => c.id === cardId)
    if (!card)
      return "https://kidyrurtyvxqokhszgko.supabase.co/storage/v1/object/public/card-images/full/placeholder.webp"

    if (useThumb && card.thumb_url) return card.thumb_url
    if (card.game8_image_url) return card.game8_image_url
    if (card.image_url) return card.image_url
    return "https://kidyrurtyvxqokhszgko.supabase.co/storage/v1/object/public/card-images/full/placeholder.webp"
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden p-4">
        <div className="text-center text-slate-500">カード情報を読み込み中...</div>
      </div>
    )
  }

  // 利用可能な列を判定
  const hasId = items.some((item) => item.id !== undefined)
  const hasExplanation = items.some((item) => item.explanation !== undefined)

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-blue-100">
            {hasId && (
              <th className="px-3 py-2 text-center text-sm font-semibold text-slate-700 border-b border-slate-200 w-16">
                {headers?.id || "ID"}
              </th>
            )}
            <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
              {headers?.card || "カード"}
            </th>
            {hasExplanation && (
              <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border-b border-slate-200">
                {headers?.explanation || "説明"}
              </th>
            )}
            <th className="px-3 py-2 text-center text-sm font-semibold text-slate-700 border-b border-slate-200 w-20">
              {headers?.quantity || "枚数"}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, itemIndex) => {
            const card = cards.find((c) => c.id === item.card_id)
            return (
              <tr key={itemIndex} className={itemIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                {hasId && (
                  <td className="px-3 py-3 text-center text-sm font-semibold text-slate-700 border-b border-slate-100">
                    <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-slate-600 rounded-full">
                      {item.id || "-"}
                    </span>
                  </td>
                )}
                <td className="px-3 py-3 text-sm text-slate-600 border-b border-slate-100">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex-shrink-0">
                      <Image
                        src={getCardImageUrl(item.card_id, true) || "/placeholder.svg"}
                        alt={card?.name || `Card ${item.card_id}`}
                        width={50}
                        height={70}
                        className="rounded border border-slate-200 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src =
                            "https://kidyrurtyvxqokhszgko.supabase.co/storage/v1/object/public/card-images/full/placeholder.webp"
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-medium text-slate-900">
                        {card?.name || `Card ID: ${item.card_id}`}
                      </div>
                    </div>
                  </div>
                </td>
                {hasExplanation && (
                  <td className="px-3 py-3 text-sm text-slate-600 border-b border-slate-100">
                    <div className="text-sm leading-relaxed">{item.explanation || "-"}</div>
                  </td>
                )}
                <td className="px-3 py-3 text-center text-sm text-slate-600 border-b border-slate-100">
                  <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-full">
                    {item.quantity}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function RenderArticle({ blocks }: RenderArticleProps) {
  return (
    <div className="prose prose-slate max-w-none">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return <div key={index}>{renderHeading(block)}</div>

          case "paragraph":
            return (
              <p key={index} className="text-slate-700 leading-relaxed my-2">
                {block.data.text.split("\\n").map((line, lineIndex, lines) => (
                  <span key={lineIndex}>
                    {line}
                    {lineIndex < lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            )

          case "rich-text":
            return <div key={index}>{renderRichText(block)}</div>

          case "image":
            return (
              <div key={index} className="my-0">
                <div className="relative w-full bg-slate-100 rounded-lg overflow-hidden">
                  <Image
                    src={block.data.url || "/placeholder.svg"}
                    alt={block.data.alt || ""}
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
                    style={{ aspectRatio: block.data.aspect }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
                  />
                </div>
                {block.data.caption && <p className="text-sm text-slate-500 text-center mt-2">{block.data.caption}</p>}
              </div>
            )

          case "toc":
            return <div key={index}>{renderToc(blocks)}</div>

          case "list":
            const ListTag = block.data.style === "numbered" ? "ol" : "ul"
            return (
              <ListTag key={index} className="my-2 text-slate-700">
                {block.data.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="leading-snug mb-1">
                    {item}
                  </li>
                ))}
              </ListTag>
            )

          case "table":
            return (
              <div key={index} className="my-0">
                {renderTable(block)}
              </div>
            )

          case "callout":
            return <div key={index}>{renderCallout(block)}</div>

          case "divider":
            return <hr key={index} className="my-2 border-slate-200" />

          case "related-links":
            return (
              <div key={index} className="mt-1 mb-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                <h4 className="font-semibold text-slate-900 mb-1">関連リンク</h4>
                <ul className="space-y-2">
                  {block.data.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )

          case "evaluation":
            return (
              <div key={index} className="my-2 bg-white border border-slate-200 rounded-lg p-6">
                <h4 className="font-semibold text-slate-900 mb-4">評価</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {block.data.tier_rank && (
                    <div>
                      <span className="text-slate-600">ティアランク:</span>
                      <span className="ml-2 font-medium">{block.data.tier_rank}</span>
                    </div>
                  )}
                  {block.data.max_damage && (
                    <div>
                      <span className="text-slate-600">最大ダメージ:</span>
                      <span className="ml-2 font-medium">{block.data.max_damage}</span>
                    </div>
                  )}
                  {block.data.build_difficulty && (
                    <div>
                      <span className="text-slate-600">構築難易度:</span>
                      <span className="ml-2 font-medium">{block.data.build_difficulty}</span>
                    </div>
                  )}
                  {block.data.stat_accessibility && (
                    <div>
                      <span className="text-slate-600">アクセス性:</span>
                      <span className="ml-2 font-medium">{block.data.stat_accessibility}</span>
                    </div>
                  )}
                  {block.data.stat_stability && (
                    <div>
                      <span className="text-slate-600">安定性:</span>
                      <span className="ml-2 font-medium">{block.data.stat_stability}</span>
                    </div>
                  )}
                  {block.data.eval_value !== undefined && block.data.eval_count !== undefined && (
                    <div className="col-span-2">
                      <span className="text-slate-600">評価:</span>
                      <span className="ml-2 font-medium">
                        {block.data.eval_value}/5 ({block.data.eval_count}件)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )

          case "cards-table":
            return <CardsTable key={index} items={block.data.items} headers={block.data.headers} />

          case "card-display-table":
            return <CardDisplayTable key={index} rows={block.data.rows} />

          case "pickup":
            return (
              <div key={index} className="my-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">★</span>
                  </div>
                  <div className="flex-1">
                    {block.data.title && <h4 className="font-semibold text-red-800 mb-2">{block.data.title}</h4>}
                    <ul className="space-y-1">
                      {block.data.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-red-700">
                          {item.href ? (
                            <Link href={item.href} className="hover:underline">
                              {item.label}
                            </Link>
                          ) : (
                            item.label
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )

          case "button":
            return (
              <div key={index} className="my-4 text-center">
                <Link
                  href={block.data.href}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {block.data.label}
                </Link>
              </div>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
