"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import type { Block } from "@/lib/actions/info-articles"
import type { JSX } from "react/jsx-runtime"

interface RenderArticleProps {
  blocks: Block[]
}

export default function RenderArticle({ blocks }: RenderArticleProps) {
  if (!blocks || blocks.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <div key={index}>{renderBlock(block)}</div>
      ))}
    </div>
  )
}

function renderBlock(block: Block) {
  switch (block.type) {
    case "heading":
      const HeadingTag = `h${block.data.level}` as keyof JSX.IntrinsicElements
      const headingClasses = {
        1: "w-full bg-black text-white px-4 py-3 text-xl font-bold my-2",
        2: "w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 text-lg font-semibold border-l-4 border-blue-800 my-2",
        3: "w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 text-base font-semibold border-l-4 border-gray-800 my-2",
      }
      return (
        <HeadingTag className={headingClasses[block.data.level]} id={block.data.anchorId}>
          {block.data.text}
        </HeadingTag>
      )

    case "paragraph":
      return <p className="text-slate-800 leading-relaxed my-2">{block.data.text}</p>

    case "image":
      return (
        <div className="my-2">
          <div className="relative w-full aspect-video bg-slate-100 rounded-lg overflow-hidden">
            <Image
              src={block.data.url || "/placeholder.svg"}
              alt={block.data.alt || ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1024px"
            />
          </div>
          {block.data.caption && <p className="text-sm text-slate-600 text-center mt-2">{block.data.caption}</p>}
        </div>
      )

    case "list":
      const ListTag = block.data.style === "numbered" ? "ol" : "ul"
      const listClass = block.data.style === "numbered" ? "list-none space-y-2 my-2" : "list-disc pl-5 space-y-1 my-2"

      return (
        <ListTag className={listClass}>
          {block.data.items.map((item, i) => (
            <li key={i} className={block.data.style === "numbered" ? "flex items-center gap-3" : ""}>
              {block.data.style === "numbered" && (
                <span className="flex-shrink-0 w-6 h-6 bg-black text-white text-sm font-bold rounded-full flex items-center justify-center">
                  {i + 1}
                </span>
              )}
              <span className="text-slate-800">{item}</span>
            </li>
          ))}
        </ListTag>
      )

    case "table":
      return (
        <div className="overflow-x-auto my-2">
          <table className="min-w-full border border-slate-200 bg-white">
            {block.data.headers && (
              <thead>
                <tr className="bg-blue-100">
                  {block.data.headers.map((header, i) => (
                    <th
                      key={i}
                      className="px-3 py-2 text-left text-sm font-semibold text-slate-700 border-b border-slate-200"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.data.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-sm text-slate-600 border-b border-slate-100">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "callout":
      const calloutStyles = {
        info: "border-blue-300 bg-blue-50 text-blue-800",
        warning: "border-yellow-300 bg-yellow-50 text-yellow-800",
        success: "border-green-300 bg-green-50 text-green-800",
      }
      return (
        <div className={`border-l-4 p-4 my-2 ${calloutStyles[block.data.tone || "info"]}`}>
          {block.data.title && <h4 className="font-semibold mb-2">{block.data.title}</h4>}
          <p>{block.data.text}</p>
        </div>
      )

    case "cards-table":
      return <CardsTable items={block.data.items} headers={block.data.headers} />

    case "pickup":
      return (
        <div className="border-l-4 border-red-400 bg-red-50 p-4 my-2">
          {block.data.title && <h3 className="font-semibold text-red-800 mb-2">{block.data.title}</h3>}
          <ul className="space-y-1">
            {block.data.items.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-red-700">
                <span className="text-red-500">★</span>
                {item.href ? (
                  <Link href={item.href} className="hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )

    case "button":
      return (
        <div className="my-2">
          <Link
            href={block.data.href}
            className="inline-flex items-center px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
          >
            {block.data.label}
          </Link>
        </div>
      )

    case "related-links":
      return (
        <div className="bg-slate-50 p-4 rounded-lg my-2">
          <h4 className="font-semibold text-slate-900 mb-3">関連リンク</h4>
          <ul className="space-y-2">
            {block.data.items.map((item, i) => (
              <li key={i}>
                <Link href={item.href} className="text-blue-600 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )

    case "divider":
      return <hr className="border-slate-300 my-4" />

    case "toc":
      // TOC implementation would go here
      return (
        <div className="bg-slate-50 p-4 rounded-lg my-2">
          <h4 className="font-semibold text-slate-900 mb-2">目次</h4>
          <p className="text-sm text-slate-600">目次は準備中です</p>
        </div>
      )

    case "evaluation":
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 my-2">
          <h4 className="font-semibold text-slate-900 mb-3">評価</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {block.data.tier_rank && (
              <div>
                <span className="text-slate-600">TIER: </span>
                <span className="font-semibold">{block.data.tier_rank}</span>
              </div>
            )}
            {block.data.max_damage && (
              <div>
                <span className="text-slate-600">最大ダメージ: </span>
                <span className="font-semibold">{block.data.max_damage}</span>
              </div>
            )}
            {block.data.build_difficulty && (
              <div>
                <span className="text-slate-600">構築難度: </span>
                <span className="font-semibold">{block.data.build_difficulty}</span>
              </div>
            )}
            {block.data.stat_accessibility && (
              <div>
                <span className="text-slate-600">使いやすさ: </span>
                <span className="font-semibold">{block.data.stat_accessibility}</span>
              </div>
            )}
            {block.data.stat_stability && (
              <div>
                <span className="text-slate-600">安定度: </span>
                <span className="font-semibold">{block.data.stat_stability}</span>
              </div>
            )}
            {block.data.eval_value && (
              <div>
                <span className="text-slate-600">総合評価: </span>
                <span className="font-semibold">{block.data.eval_value}</span>
                {block.data.eval_count && (
                  <span className="text-slate-500 text-xs ml-1">({block.data.eval_count})</span>
                )}
              </div>
            )}
          </div>
        </div>
      )

    default:
      return null
  }
}

function CardsTable({
  items,
  headers,
}: {
  items: Array<{ id?: string; card_id: number; explanation?: string; quantity: number }>
  headers?: { id?: string; card?: string; explanation?: string; quantity?: string }
}) {
  const [cards, setCards] = useState<Array<{ id: number; name: string; thumb_url?: string; image_url?: string }>>([])

  useEffect(() => {
    async function fetchCards() {
      try {
        const cardIds = items.map((item) => item.card_id).filter((id) => Number.isFinite(id))
        if (cardIds.length === 0) return

        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data } = await supabase.from("cards").select("id,name,thumb_url,image_url").in("id", cardIds)
        setCards(data || [])
      } catch (error) {
        console.error("Failed to fetch cards:", error)
      }
    }

    fetchCards()
  }, [items])

  // 表示するカラムを判定
  const hasId = items.some((item) => item.id)
  const hasExplanation = items.some((item) => item.explanation)

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden my-2">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-blue-100">
            {hasId && (
              <th className="px-3 py-2 text-center text-sm font-semibold text-slate-700 border-b border-slate-200">
                {headers?.id || "ID"}
              </th>
            )}
            <th className="px-3 py-2 text-center text-sm font-semibold text-slate-700 border-b border-slate-200">
              {headers?.card || "カード"}
            </th>
            {hasExplanation && (
              <th className="px-3 py-2 text-center text-sm font-semibold text-slate-700 border-b border-slate-200">
                {headers?.explanation || "説明"}
              </th>
            )}
            <th className="px-3 py-2 text-center text-sm font-semibold text-slate-700 border-b border-slate-200">
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
                  <td className="px-3 py-2 text-center text-sm text-slate-600 border-b border-slate-100 align-middle">
                    {item.id || "-"}
                  </td>
                )}
                <td className="px-3 py-2 text-center text-sm text-slate-600 border-b border-slate-100 align-middle">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex-shrink-0">
                      <Image
                        src={card?.thumb_url || card?.image_url || "/placeholder.svg"}
                        alt={card?.name || `Card ${item.card_id}`}
                        width={60}
                        height={84}
                        className="rounded border border-slate-200 object-cover"
                      />
                    </div>
                    <div className="text-sm font-medium text-slate-900 text-center">
                      {card?.name || `Card ID: ${item.card_id}`}
                    </div>
                  </div>
                </td>
                {hasExplanation && (
                  <td className="px-3 py-2 text-center text-sm text-slate-600 border-b border-slate-100 align-middle">
                    {item.explanation || "-"}
                  </td>
                )}
                <td className="px-3 py-2 text-center text-sm text-slate-600 border-b border-slate-100 align-middle">
                  <div className="flex justify-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-blue-600 rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
