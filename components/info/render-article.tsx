"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

interface ArticleBlock {
  id: string
  type: string
  data: any
  order_index: number
}

interface CardData {
  id: number
  name: string
  image_url?: string
  game8_image_url?: string
}

interface RenderArticleProps {
  blocks: ArticleBlock[]
}

export default function RenderArticle({ blocks }: RenderArticleProps) {
  const [cardData, setCardData] = useState<{ [key: number]: CardData }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // カードデータを取得する関数
  const fetchCardData = async (cardIds: number[]) => {
    if (cardIds.length === 0) return

    setLoading(true)
    setError(null)

    try {
      console.log("Fetching cards with IDs:", cardIds)

      const { data, error } = await supabase
        .from("cards")
        .select("id, name, image_url, game8_image_url")
        .in("id", cardIds)

      if (error) {
        console.error("Supabase error:", error)
        setError(`カードデータの取得に失敗しました: ${error.message}`)
        return
      }

      if (data) {
        console.log("Fetched card data:", data)
        const cardMap = data.reduce(
          (acc, card) => {
            acc[card.id] = card
            return acc
          },
          {} as { [key: number]: CardData },
        )

        setCardData((prev) => ({ ...prev, ...cardMap }))
      }
    } catch (err) {
      console.error("Error fetching card data:", err)
      setError("カードデータの取得中にエラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  // ブロック内のカードIDを収集
  useEffect(() => {
    const cardIds = new Set<number>()

    blocks.forEach((block) => {
      if (block.type === "cards-table" && block.data?.items) {
        block.data.items.forEach((item: any) => {
          if (item.card_id) {
            cardIds.add(item.card_id)
          }
        })
      } else if (block.type === "card-display-table" && block.data?.items) {
        block.data.items.forEach((item: any) => {
          if (item.card_id) {
            cardIds.add(item.card_id)
          }
        })
      } else if (block.type === "key-value-table" && block.data?.items) {
        block.data.items.forEach((item: any) => {
          if (item.cardValues && Array.isArray(item.cardValues)) {
            item.cardValues.forEach((cardValue: any) => {
              if (cardValue.card_id) {
                cardIds.add(cardValue.card_id)
              }
            })
          }
        })
      }
    })

    if (cardIds.size > 0) {
      fetchCardData(Array.from(cardIds))
    }
  }, [blocks])

  const getCardImageUrl = (card: CardData): string => {
    if (card.game8_image_url) {
      return card.game8_image_url
    }
    if (card.image_url) {
      return card.image_url
    }
    return "/no-card.png"
  }

  const renderBlock = (block: ArticleBlock) => {
    switch (block.type) {
      case "heading":
        const HeadingTag = `h${block.data.level || 2}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag key={block.id} className="font-bold mb-4 mt-6">
            {block.data.text}
          </HeadingTag>
        )

      case "paragraph":
        return (
          <p key={block.id} className="mb-4 leading-relaxed">
            {block.data.text}
          </p>
        )

      case "rich-text":
        return (
          <div
            key={block.id}
            className="mb-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: block.data.html || block.data.text }}
          />
        )

      case "image":
        return (
          <div key={block.id} className="mb-6">
            <Image
              src={block.data.url || "/placeholder.svg"}
              alt={block.data.alt || ""}
              width={block.data.width || 600}
              height={block.data.height || 400}
              className="rounded-lg"
            />
            {block.data.caption && <p className="text-sm text-gray-600 mt-2 text-center">{block.data.caption}</p>}
          </div>
        )

      case "list":
        const ListTag = block.data.ordered ? "ol" : "ul"
        return (
          <ListTag key={block.id} className="mb-4 ml-6">
            {block.data.items?.map((item: string, index: number) => (
              <li key={index} className="mb-1">
                {item}
              </li>
            ))}
          </ListTag>
        )

      case "table":
        return (
          <div key={block.id} className="mb-6 overflow-x-auto">
            <Table>
              {block.data.headers && (
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    {block.data.headers.map((header: string, index: number) => (
                      <TableHead key={index} className="font-semibold text-blue-900">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
              )}
              <TableBody>
                {block.data.rows?.map((row: string[], rowIndex: number) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )

      case "flexible-table":
        return (
          <div key={block.id} className="mb-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  {block.data.columns?.map((column: any, index: number) => (
                    <TableHead key={index} className="font-semibold text-blue-900">
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {block.data.rows?.map((row: any, rowIndex: number) => (
                  <TableRow key={rowIndex}>
                    {block.data.columns?.map((column: any, colIndex: number) => (
                      <TableCell key={colIndex}>{row[column.key] || ""}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )

      case "key-value-table":
        return (
          <div key={block.id} className="mb-6">
            {block.data.title && <h3 className="text-lg font-semibold mb-4">{block.data.title}</h3>}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="font-semibold text-blue-900 w-1/3">
                      {block.data.keyHeader || "キー"}
                    </TableHead>
                    <TableHead className="font-semibold text-blue-900">{block.data.valueHeader || "値"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {block.data.items?.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.key}</TableCell>
                      <TableCell>
                        {item.cardValues && Array.isArray(item.cardValues) && item.cardValues.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.cardValues.map((cardValue: any, cardIndex: number) => {
                              const card = cardData[cardValue.card_id]
                              if (!card) {
                                return (
                                  <div key={cardIndex} className="text-sm text-gray-500">
                                    カードID: {cardValue.card_id} (読み込み中...)
                                  </div>
                                )
                              }
                              return (
                                <div
                                  key={cardIndex}
                                  className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50"
                                >
                                  <div className="relative w-16 h-22 flex-shrink-0">
                                    <Image
                                      src={getCardImageUrl(card) || "/placeholder.svg"}
                                      alt={card.name}
                                      fill
                                      className="object-cover rounded"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/no-card.png"
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{card.name}</div>
                                    {cardValue.quantity && (
                                      <div className="text-xs text-gray-600">数量: {cardValue.quantity}</div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <span>{item.value}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case "cards-table":
        return (
          <div key={block.id} className="mb-6">
            {block.data.title && <h3 className="text-lg font-semibold mb-4">{block.data.title}</h3>}
            <div className="grid gap-4">
              {block.data.items?.map((item: any, index: number) => {
                const card = cardData[item.card_id]
                if (!card) {
                  return (
                    <div key={index} className="text-center text-gray-500">
                      カードID: {item.card_id} (読み込み中...)
                    </div>
                  )
                }
                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-28 flex-shrink-0">
                        <Image
                          src={getCardImageUrl(card) || "/placeholder.svg"}
                          alt={card.name}
                          fill
                          className="object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/no-card.png"
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{card.name}</h4>
                        {item.quantity && <p className="text-sm text-gray-600">数量: {item.quantity}</p>}
                        {item.explanation && <p className="text-sm mt-2">{item.explanation}</p>}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      case "card-display-table":
        return (
          <div key={block.id} className="mb-6">
            {block.data.title && <h3 className="text-lg font-semibold mb-4">{block.data.title}</h3>}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="font-semibold text-blue-900">ID</TableHead>
                    <TableHead className="font-semibold text-blue-900">カード</TableHead>
                    <TableHead className="font-semibold text-blue-900">説明</TableHead>
                    <TableHead className="font-semibold text-blue-900">数量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {block.data.items?.map((item: any, index: number) => {
                    const card = cardData[item.card_id]
                    return (
                      <TableRow key={index} className="align-middle">
                        <TableCell className="text-center">{item.card_id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative w-24 h-32">
                              {card ? (
                                <Image
                                  src={getCardImageUrl(card) || "/placeholder.svg"}
                                  alt={card.name}
                                  fill
                                  className="object-cover rounded"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "/no-card.png"
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                  読み込み中...
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-medium text-center">
                              {card?.name || `カードID: ${item.card_id}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.explanation || "-"}</TableCell>
                        <TableCell className="text-center">{item.quantity || "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      case "callout":
        const calloutStyles = {
          info: "border-blue-200 bg-blue-50 text-blue-900",
          warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
          error: "border-red-200 bg-red-50 text-red-900",
          success: "border-green-200 bg-green-50 text-green-900",
        }
        const style = calloutStyles[block.data.type as keyof typeof calloutStyles] || calloutStyles.info

        return (
          <Alert key={block.id} className={`mb-4 ${style}`}>
            <AlertDescription>{block.data.text}</AlertDescription>
          </Alert>
        )

      case "pickup":
        return (
          <div key={block.id} className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📌 ピックアップ情報</h3>
            <div className="text-blue-800">
              {block.data.items?.map((item: any, index: number) => (
                <div key={index} className="mb-2">
                  <strong>{item.title}:</strong> {item.description}
                </div>
              ))}
            </div>
          </div>
        )

      case "button":
        return (
          <div key={block.id} className="mb-4">
            <Button
              variant={block.data.variant || "default"}
              size={block.data.size || "default"}
              className="w-full sm:w-auto"
            >
              {block.data.text}
            </Button>
          </div>
        )

      default:
        return (
          <div key={block.id} className="mb-4 p-4 border border-gray-200 rounded bg-gray-50">
            <p className="text-sm text-gray-600">未対応のブロックタイプ: {block.type}</p>
            <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(block.data, null, 2)}</pre>
          </div>
        )
    }
  }

  if (error) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50 text-red-900">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {loading && <div className="mb-4 text-center text-gray-600">カードデータを読み込み中...</div>}
      {blocks.sort((a, b) => a.order_index - b.order_index).map(renderBlock)}
    </div>
  )
}
