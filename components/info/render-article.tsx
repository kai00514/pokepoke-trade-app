"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Block } from "@/lib/actions/info-articles"
import type { JSX } from "react"

interface RenderArticleProps {
  blocks: Block[]
}

interface CardData {
  id: number
  name: string
  game8_image_url?: string
}

export function RenderArticle({ blocks }: RenderArticleProps) {
  const [cardData, setCardData] = useState<Record<number, CardData>>({})
  const [loadingCards, setLoadingCards] = useState(true)

  // カード画像のフォールバック処理
  const getCardImageUrl = (card: CardData | undefined) => {
    if (!card) return "/no-card.png"
    return card.game8_image_url || "/no-card.png"
  }

  // 全ブロックからカードIDを収集
  useEffect(() => {
    const collectCardIds = (): number[] => {
      const cardIds = new Set<number>()

      blocks.forEach((block) => {
        switch (block.type) {
          case "cards-table":
            block.data.items?.forEach((item) => {
              const cardId = typeof item.card_id === "string" ? Number.parseInt(item.card_id, 10) : item.card_id
              if (!isNaN(cardId)) {
                cardIds.add(cardId)
              }
            })
            break

          case "card-display-table":
            block.data.rows?.forEach((row) => {
              row.cards?.forEach((card) => {
                const cardId = Number.parseInt(card.id, 10)
                if (!isNaN(cardId)) {
                  cardIds.add(cardId)
                }
              })
            })
            break

          case "key-value-table":
            block.data.rows?.forEach((row) => {
              if (row.valueType === "card" && row.cardValues) {
                row.cardValues.forEach((card) => {
                  const cardId = Number.parseInt(card.id, 10)
                  if (!isNaN(cardId)) {
                    cardIds.add(cardId)
                  }
                })
              }
            })
            break

          case "flexible-table":
            block.data.rows?.forEach((row) => {
              Object.values(row.cells || {}).forEach((cellValue) => {
                if (typeof cellValue === "string") {
                  const cardId = Number.parseInt(cellValue, 10)
                  if (!isNaN(cardId)) {
                    cardIds.add(cardId)
                  }
                }
              })
            })
            break
        }
      })

      return Array.from(cardIds)
    }

    const fetchCardData = async () => {
      const cardIds = collectCardIds()
      console.log("Collected card IDs:", cardIds)

      if (cardIds.length === 0) {
        setLoadingCards(false)
        return
      }

      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("cards").select("id, name, game8_image_url").in("id", cardIds)

        if (error) {
          console.error("Error fetching card data:", error)
        } else {
          console.log("Fetched card data:", data)
          const cardMap = (data || []).reduce(
            (acc, card) => {
              acc[card.id] = card
              return acc
            },
            {} as Record<number, CardData>,
          )
          setCardData(cardMap)
        }
      } catch (error) {
        console.error("Error in fetchCardData:", error)
      } finally {
        setLoadingCards(false)
      }
    }

    fetchCardData()
  }, [blocks])

  const renderBlock = (block: Block, index: number) => {
    switch (block.type) {
      case "heading":
        const HeadingTag = `h${block.data.level}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag
            key={index}
            id={block.data.anchorId}
            className={`font-bold text-slate-900 ${
              block.data.level === 1
                ? "text-3xl mb-6"
                : block.data.level === 2
                  ? "text-2xl mb-4 mt-8"
                  : "text-xl mb-3 mt-6"
            }`}
          >
            {block.data.text}
          </HeadingTag>
        )

      case "paragraph":
        return (
          <p key={index} className="text-slate-700 leading-relaxed mb-4">
            {block.data.text}
          </p>
        )

      case "image":
        return (
          <div key={index} className="my-6">
            <img
              src={block.data.url || "/placeholder.svg"}
              alt={block.data.alt || ""}
              className="w-full rounded-lg shadow-sm"
              style={{
                aspectRatio: block.data.aspect || "auto",
              }}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=400&width=600"
              }}
            />
            {block.data.caption && <p className="text-sm text-slate-500 text-center mt-2">{block.data.caption}</p>}
          </div>
        )

      case "list":
        const ListTag = block.data.style === "numbered" ? "ol" : "ul"
        return (
          <ListTag
            key={index}
            className={`mb-4 pl-6 space-y-1 ${
              block.data.style === "numbered" ? "list-decimal" : "list-disc"
            } text-slate-700`}
          >
            {block.data.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ListTag>
        )

      case "table":
        return (
          <div key={index} className="my-6 overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
            <table className="w-full">
              {block.data.headers && (
                <thead>
                  <tr className="bg-blue-100 border-b border-slate-200">
                    {block.data.headers.map((header, headerIndex) => (
                      <th
                        key={headerIndex}
                        className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider border-r border-slate-200 last:border-r-0"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {block.data.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-xs text-slate-700 border-r border-slate-200 last:border-r-0"
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

      case "callout":
        const calloutStyles = {
          info: "bg-blue-50 border-blue-200 text-blue-800",
          warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
          success: "bg-green-50 border-green-200 text-green-800",
        }
        return (
          <div key={index} className={`p-4 rounded-lg border-l-4 mb-4 ${calloutStyles[block.data.tone || "info"]}`}>
            {block.data.title && <h4 className="font-semibold mb-2">{block.data.title}</h4>}
            <p>{block.data.text}</p>
          </div>
        )

      case "cards-table":
        if (loadingCards) {
          return (
            <div key={index} className="my-6 p-4 text-center text-slate-500">
              カードデータを読み込み中...
            </div>
          )
        }

        return (
          <div key={index} className="my-6 overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-100 border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase tracking-wider border-r border-slate-200 w-16">
                    {block.data.headers?.id || "番号"}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase tracking-wider border-r border-slate-200">
                    {block.data.headers?.card || "ポケモンカード"}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase tracking-wider border-r border-slate-200 w-20">
                    {block.data.headers?.quantity || "使用枚数"}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    {block.data.headers?.explanation || "役割"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {block.data.items.map((item, itemIndex) => {
                  const cardId = typeof item.card_id === "string" ? Number.parseInt(item.card_id, 10) : item.card_id
                  const card = cardData[cardId]

                  return (
                    <tr key={itemIndex} className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-2 text-xs text-slate-700 border-r border-slate-200 text-center">
                        {item.id || itemIndex + 1}
                      </td>
                      <td className="px-3 py-2 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          <img
                            src={getCardImageUrl(card) || "/placeholder.svg"}
                            alt={card?.name || `カード${cardId}`}
                            className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "/no-card.png"
                            }}
                          />
                          <span className="text-xs text-slate-700 truncate max-w-32">
                            {card?.name || item.name || `カードID: ${cardId}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700 border-r border-slate-200 text-center">
                        {item.quantity || 1}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-700">{item.explanation || ""}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )

      case "card-display-table":
        if (loadingCards) {
          return (
            <div key={index} className="my-6 p-4 text-center text-slate-500">
              カードデータを読み込み中...
            </div>
          )
        }

        return (
          <div key={index} className="my-6 overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
            <table className="w-full">
              <tbody>
                {block.data.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-3 text-xs font-medium text-slate-700 bg-blue-100 border-r border-slate-200 w-auto whitespace-nowrap">
                      {row.header}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.cards.map((card, cardIndex) => {
                          const cardId = Number.parseInt(card.id, 10)
                          const cardInfo = cardData[cardId]

                          return (
                            <div key={cardIndex} className="flex flex-col items-center">
                              <img
                                src={getCardImageUrl(cardInfo) || "/placeholder.svg"}
                                alt={cardInfo?.name || card.name}
                                className="w-10 h-14 object-cover rounded shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.src = "/no-card.png"
                                }}
                              />
                              <span className="text-xs text-slate-600 mt-1 text-center truncate max-w-16">
                                {cardInfo?.name || card.name}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case "key-value-table":
        if (loadingCards) {
          return (
            <div key={index} className="my-6 p-4 text-center text-slate-500">
              カードデータを読み込み中...
            </div>
          )
        }

        return (
          <div key={index} className="my-6 overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
            <table className="w-full">
              <tbody>
                {block.data.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-3 text-xs font-medium text-slate-700 bg-blue-100 border-r border-slate-200 w-auto whitespace-nowrap">
                      {row.key}
                    </td>
                    <td className="px-3 py-3">
                      {row.valueType === "card" && row.cardValues ? (
                        <div className="flex flex-wrap gap-2">
                          {row.cardValues.map((card, cardIndex) => {
                            const cardId = Number.parseInt(card.id, 10)
                            const cardInfo = cardData[cardId]

                            return (
                              <div key={cardIndex} className="flex flex-col items-center">
                                <img
                                  src={getCardImageUrl(cardInfo) || "/placeholder.svg"}
                                  alt={cardInfo?.name || card.name}
                                  className="w-10 h-14 object-cover rounded shadow-sm"
                                  onError={(e) => {
                                    e.currentTarget.src = "/no-card.png"
                                  }}
                                />
                                <span className="text-xs text-slate-600 mt-1 text-center truncate max-w-16">
                                  {cardInfo?.name || card.name}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-700">{row.textValue || ""}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case "flexible-table":
        return (
          <div key={index} className="my-6 overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
            {block.data.title && (
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-medium text-slate-900">{block.data.title}</h3>
              </div>
            )}
            <table className="w-full">
              <thead>
                <tr className="bg-blue-100 border-b border-slate-200">
                  {block.data.columns.map((column, colIndex) => (
                    <th
                      key={colIndex}
                      className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase tracking-wider border-r border-slate-200 last:border-r-0"
                      style={{ width: column.width !== "auto" ? column.width : undefined }}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.data.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50 border-b border-slate-100 last:border-b-0">
                    {block.data.columns.map((column, colIndex) => {
                      const cellValue = row.cells[column.id] || ""

                      return (
                        <td
                          key={colIndex}
                          className="px-3 py-2 text-xs text-slate-700 border-r border-slate-200 last:border-r-0"
                        >
                          {column.type === "image" ? (
                            <img
                              src={cellValue || "/placeholder.svg"}
                              alt=""
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=48&width=48"
                              }}
                            />
                          ) : column.type === "link" ? (
                            <a
                              href={cellValue}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {cellValue}
                            </a>
                          ) : (
                            cellValue
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case "pickup":
        return (
          <Card key={index} className="my-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-red-600" />
                <h3 className="font-semibold text-red-900">{block.data.title || "ピックアップ情報"}</h3>
              </div>
              <ul className="space-y-2">
                {block.data.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-red-600 rounded-full flex-shrink-0" />
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-red-800 hover:text-red-900 underline text-sm"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span className="text-red-800 text-sm">{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )

      case "button":
        return (
          <div key={index} className="my-6 text-center">
            <Button asChild variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 bg-transparent">
              <a href={block.data.href} target="_blank" rel="noopener noreferrer">
                {block.data.label}
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )

      case "divider":
        return <hr key={index} className="my-8 border-slate-200" />

      case "toc":
        // TOC implementation would go here
        return (
          <div key={index} className="my-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-2">目次</h3>
            <p className="text-sm text-slate-600">目次は見出しから自動生成されます</p>
          </div>
        )

      case "related-links":
        return (
          <div key={index} className="my-6">
            <h3 className="font-semibold text-slate-900 mb-3">関連リンク</h3>
            <ul className="space-y-2">
              {block.data.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <a
                    href={item.href}
                    className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )

      case "evaluation":
        return (
          <Card key={index} className="my-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3">デッキ評価</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {block.data.tier_rank && (
                  <div>
                    <span className="text-slate-600">ティアランク:</span>
                    <Badge variant="secondary" className="ml-2">
                      {block.data.tier_rank}
                    </Badge>
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
              </div>
            </CardContent>
          </Card>
        )

      default:
        return (
          <div key={index} className="my-4 p-4 bg-slate-100 rounded-lg">
            <p className="text-slate-600">未対応のブロックタイプ: {(block as any).type}</p>
          </div>
        )
    }
  }

  return <div className="max-w-4xl mx-auto space-y-4">{blocks.map((block, index) => renderBlock(block, index))}</div>
}
