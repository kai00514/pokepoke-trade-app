"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { JSX } from "react"

interface CardData {
  id: number
  name: string
  image_url?: string
  game8_image_url?: string
  thumb_url?: string
}

interface KeyValueRow {
  id: string
  key: string
  valueType: "text" | "card"
  textValue?: string
  cardValues?: {
    id: string
    name: string
    imageUrl: string
  }[]
}

interface KeyValueTableBlockData {
  rows: KeyValueRow[]
}

interface Block {
  id: string
  type: string
  data: any
  order_index: number
}

interface RenderArticleProps {
  blocks: Block[]
}

export default function RenderArticle({ blocks }: RenderArticleProps) {
  const [cardData, setCardData] = useState<{ [key: string]: CardData }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCardData = async () => {
      const supabase = createClient()
      const cardIds = new Set<number>()

      // すべてのブロックからカードIDを収集
      blocks.forEach((block) => {
        if (block.type === "cards-table" && block.data?.items) {
          block.data.items.forEach((item: any) => {
            if (item.card_id) {
              cardIds.add(item.card_id)
            }
          })
        }
        if (block.type === "card-display-table" && block.data?.items) {
          block.data.items.forEach((item: any) => {
            if (item.card_id) {
              cardIds.add(item.card_id)
            }
          })
        }
        if (block.type === "key-value-table" && block.data?.rows) {
          block.data.rows.forEach((row: KeyValueRow) => {
            if (row.valueType === "card" && row.cardValues) {
              row.cardValues.forEach((card) => {
                cardIds.add(Number.parseInt(card.id))
              })
            }
          })
        }
      })

      if (cardIds.size > 0) {
        try {
          const { data: cards, error } = await supabase
            .from("cards")
            .select("id, name, image_url, game8_image_url, thumb_url")
            .in("id", Array.from(cardIds))

          if (error) {
            console.error("Error fetching cards:", error)
          } else if (cards) {
            const cardMap: { [key: string]: CardData } = {}
            cards.forEach((card) => {
              cardMap[card.id.toString()] = card
            })
            setCardData(cardMap)
          }
        } catch (error) {
          console.error("Error loading card data:", error)
        }
      }
      setLoading(false)
    }

    loadCardData()
  }, [blocks])

  const getCardImageUrl = (card: CardData): string => {
    if (card.game8_image_url) {
      return card.game8_image_url
    }
    if (card.image_url) {
      return card.image_url
    }
    if (card.thumb_url) {
      return card.thumb_url
    }
    return "/placeholder.svg"
  }

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case "paragraph":
        return (
          <div key={block.id} className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{block.data.content || block.data.text}</p>
          </div>
        )

      case "heading":
        const HeadingTag = `h${block.data.level}` as keyof JSX.IntrinsicElements
        return (
          <div key={block.id} className="prose max-w-none">
            {HeadingTag && (
              <HeadingTag className="font-bold text-gray-900 mt-8 mb-4">
                {block.data.content || block.data.text}
              </HeadingTag>
            )}
          </div>
        )

      case "image":
        return (
          <div key={block.id} className="my-6">
            <div className="relative w-full max-w-2xl mx-auto">
              <Image
                src={block.data.url || "/placeholder.svg"}
                alt={block.data.caption || block.data.alt || "画像"}
                width={800}
                height={600}
                className="rounded-lg shadow-md w-full h-auto"
              />
              {block.data.caption && <p className="text-sm text-gray-600 text-center mt-2">{block.data.caption}</p>}
            </div>
          </div>
        )

      case "list":
        const ListTag = block.data.style === "numbered" ? "ol" : "ul"
        return (
          <div key={block.id} className="prose max-w-none">
            <ListTag className="list-disc list-inside space-y-2 text-gray-700">
              {block.data.items?.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ListTag>
          </div>
        )

      case "table":
        return (
          <div key={block.id} className="my-6 overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              {block.data.headers && (
                <thead>
                  <tr className="bg-blue-50">
                    {block.data.headers.map((header: string, index: number) => (
                      <th key={index} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {block.data.rows?.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="border border-gray-300 px-4 py-2">
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
          info: "bg-blue-50 border-blue-200 text-blue-800",
          warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
          error: "bg-red-50 border-red-200 text-red-800",
          success: "bg-green-50 border-green-200 text-green-800",
        }
        return (
          <div
            key={block.id}
            className={`p-4 rounded-lg border-l-4 my-6 ${
              calloutStyles[block.data.tone as keyof typeof calloutStyles] || calloutStyles.info
            }`}
          >
            <p className="font-medium">{block.data.text || block.data.content}</p>
          </div>
        )

      case "button":
        return (
          <div key={block.id} className="my-6 text-center">
            <Button
              onClick={() => window.open(block.data.href || block.data.url, "_blank")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              {block.data.label || block.data.text}
            </Button>
          </div>
        )

      case "pickup":
        return (
          <div key={block.id} className="my-8">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">★</span>
                </div>
                <div className="flex-1">
                  {block.data.title && <h4 className="font-semibold text-red-800 mb-2">{block.data.title}</h4>}
                  <ul className="space-y-1">
                    {block.data.items?.map((item: any, itemIndex: number) => (
                      <li key={itemIndex} className="text-red-700">
                        {item.href ? (
                          <a href={item.href} className="hover:underline">
                            {item.label}
                          </a>
                        ) : (
                          item.label
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case "cards-table":
        if (!block.data?.items || !Array.isArray(block.data.items)) {
          return (
            <div key={block.id} className="my-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">カードデータがありません。</p>
            </div>
          )
        }

        return (
          <div key={block.id} className="my-6">
            {block.data.header && <h3 className="text-lg font-bold text-gray-900 mb-4">{block.data.header}</h3>}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">カード</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">説明</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">枚数</th>
                  </tr>
                </thead>
                <tbody>
                  {block.data.items.map((item: any, index: number) => {
                    const card = cardData[item.card_id?.toString()]
                    return (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-300 px-4 py-3 align-middle">
                          {card ? (
                            <div className="flex items-center space-x-3">
                              <Image
                                src={getCardImageUrl(card) || "/placeholder.svg"}
                                alt={card.name}
                                width={60}
                                height={84}
                                className="rounded border border-gray-200 object-cover flex-shrink-0"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg"
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-gray-900 break-words">{card.name}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">カードID: {item.card_id}</div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 align-middle">
                          <div className="text-sm text-gray-700 break-words">{item.explanation || "説明なし"}</div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center align-middle">
                          <Badge variant="secondary" className="text-sm">
                            {item.quantity || 1}枚
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "card-display-table":
        if (!block.data?.rows || !Array.isArray(block.data.rows)) {
          return (
            <div key={block.id} className="my-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">カードデータがありません。</p>
            </div>
          )
        }

        return (
          <div key={block.id} className="my-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <tbody>
                  {block.data.rows.map((row: any, rowIndex: number) => (
                    <tr key={row.id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-700 border border-gray-300 bg-blue-50 align-top whitespace-nowrap">
                        {row.header}
                      </td>
                      <td className="px-4 py-4 border border-gray-300 w-full">
                        {row.cards && row.cards.length > 0 ? (
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                            {row.cards.map((card: any, cardIndex: number) => {
                              const dbCard = cardData[card.id]
                              const imageUrl = dbCard ? getCardImageUrl(dbCard) : card.imageUrl
                              const cardName = dbCard ? dbCard.name : card.name

                              return (
                                <div key={`${card.id}-${cardIndex}`} className="flex flex-col items-center">
                                  <div className="aspect-[5/7] relative rounded border overflow-hidden bg-gray-100 w-full max-w-[80px]">
                                    <Image
                                      src={imageUrl || "/placeholder.svg"}
                                      alt={cardName}
                                      fill
                                      className="object-cover"
                                      sizes="80px"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/placeholder.svg"
                                      }}
                                    />
                                  </div>
                                  <div className="mt-1 text-[10px] text-gray-600 text-center truncate w-full max-w-[80px]">
                                    {cardName}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">カードが選択されていません</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "flexible-table":
        if (!block.data?.rows || !Array.isArray(block.data.rows)) {
          return (
            <div key={block.id} className="my-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">テーブルデータがありません。</p>
            </div>
          )
        }

        return (
          <div key={block.id} className="my-6">
            {block.data.title && <h3 className="text-lg font-bold text-gray-900 mb-4">{block.data.title}</h3>}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <tbody>
                  {block.data.rows.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {block.data.columns?.map((column: any, colIndex: number) => {
                        const value = row.cells?.[column.id] || ""
                        return (
                          <td
                            key={colIndex}
                            className={`border border-gray-300 px-4 py-3 ${
                              colIndex === 0 ? "bg-blue-50 font-semibold" : ""
                            }`}
                          >
                            {column.type === "image" && value ? (
                              <Image
                                src={value || "/placeholder.svg"}
                                alt="テーブル画像"
                                width={60}
                                height={60}
                                className="object-cover rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg"
                                }}
                              />
                            ) : column.type === "link" && value ? (
                              <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate"
                              >
                                {value}
                              </a>
                            ) : (
                              <span>{value || "-"}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "key-value-table":
        const keyValueData = block.data as KeyValueTableBlockData
        if (!keyValueData?.rows || !Array.isArray(keyValueData.rows)) {
          return (
            <div key={block.id} className="my-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">テーブルデータがありません。</p>
            </div>
          )
        }

        return (
          <div key={block.id} className="my-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <tbody>
                  {keyValueData.rows.map((row: KeyValueRow, rowIndex: number) => (
                    <tr key={row.id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-300 bg-blue-50 align-top whitespace-nowrap w-32">
                        {row.key}
                      </td>
                      <td className="px-4 py-3 border border-gray-300 w-full">
                        {row.valueType === "text" ? (
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {row.textValue || "（内容なし）"}
                          </div>
                        ) : row.cardValues && row.cardValues.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {row.cardValues.map((cardValue) => {
                              const card = cardData[cardValue.id]
                              return (
                                <div key={cardValue.id} className="flex flex-col items-center space-y-1">
                                  <Image
                                    src={card ? getCardImageUrl(card) : cardValue.imageUrl || "/placeholder.svg"}
                                    alt={card ? card.name : cardValue.name}
                                    width={80}
                                    height={112}
                                    className="rounded border border-gray-200 object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = "/placeholder.svg"
                                    }}
                                  />
                                  <p className="text-xs font-medium text-gray-900 text-center line-clamp-2 max-w-[80px]">
                                    {card ? card.name : cardValue.name}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">（カード未選択）</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case "media-gallery":
        return (
          <div key={block.id} className="my-6">
            {block.data.title && <h3 className="text-lg font-bold text-gray-900 mb-4">{block.data.title}</h3>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {block.data.items?.map((item: any, index: number) => (
                <div key={index} className="relative">
                  <Image
                    src={item.url || "/placeholder.svg"}
                    alt={item.caption || `画像 ${index + 1}`}
                    width={400}
                    height={300}
                    className="rounded-lg shadow-md w-full h-48 object-cover"
                  />
                  {item.caption && <p className="text-sm text-gray-600 text-center mt-2">{item.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        )

      case "rich-text":
        return (
          <div key={block.id} className="prose max-w-none my-6">
            <div dangerouslySetInnerHTML={{ __html: block.data.content }} />
          </div>
        )

      case "toc":
        return (
          <div key={block.id} className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">目次</h4>
            <p className="text-blue-700 text-sm">目次は自動生成されます</p>
          </div>
        )

      case "divider":
        return <hr key={block.id} className="my-8 border-gray-300" />

      case "related-links":
        return (
          <div key={block.id} className="my-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">関連リンク</h4>
            <ul className="space-y-2">
              {block.data.items?.map((item: any, itemIndex: number) => (
                <li key={itemIndex}>
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                  >
                    <span>→</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )

      case "evaluation":
        return (
          <div key={block.id} className="my-6 bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">評価</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {block.data.tier_rank && (
                <div>
                  <span className="text-gray-600">ティアランク:</span>
                  <span className="ml-2 font-medium">{block.data.tier_rank}</span>
                </div>
              )}
              {block.data.max_damage && (
                <div>
                  <span className="text-gray-600">最大ダメージ:</span>
                  <span className="ml-2 font-medium">{block.data.max_damage}</span>
                </div>
              )}
              {block.data.build_difficulty && (
                <div>
                  <span className="text-gray-600">構築難易度:</span>
                  <span className="ml-2 font-medium">{block.data.build_difficulty}</span>
                </div>
              )}
              {block.data.stat_accessibility && (
                <div>
                  <span className="text-gray-600">アクセス性:</span>
                  <span className="ml-2 font-medium">{block.data.stat_accessibility}</span>
                </div>
              )}
              {block.data.stat_stability && (
                <div>
                  <span className="text-gray-600">安定性:</span>
                  <span className="ml-2 font-medium">{block.data.stat_stability}</span>
                </div>
              )}
              {block.data.eval_value !== undefined && block.data.eval_count !== undefined && (
                <div className="col-span-2">
                  <span className="text-gray-600">評価:</span>
                  <span className="ml-2 font-medium">
                    {block.data.eval_value}/5 ({block.data.eval_count}件)
                  </span>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div key={block.id} className="my-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              未対応のブロックタイプ: <code className="bg-yellow-100 px-2 py-1 rounded">{block.type}</code>
            </p>
            <pre className="mt-2 text-xs text-yellow-700 overflow-auto">{JSON.stringify(block.data, null, 2)}</pre>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {blocks.map((block) => (
          <div key={block.id} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {blocks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((block) => renderBlock(block))}
    </div>
  )
}
