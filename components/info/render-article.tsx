"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Star, ExternalLink, Info, AlertTriangle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Block } from "@/lib/actions/info-articles"
import type { JSX } from "react"

interface RenderArticleProps {
  blocks: Block[]
}

interface CardData {
  id: number
  name: string
  image_url?: string
  game8_image_url?: string
}

export default function RenderArticle({ blocks }: RenderArticleProps) {
  const [cardData, setCardData] = useState<{ [key: number]: CardData }>({})
  const [loading, setLoading] = useState(true)

  // カードデータを取得する関数
  useEffect(() => {
    const fetchCardData = async () => {
      const supabase = createClient()
      const cardIds = new Set<number>()

      // すべてのブロックからカードIDを収集
      blocks.forEach((block) => {
        if (block.type === "cards-table" && block.data?.items) {
          block.data.items.forEach((item: any) => {
            if (item.card_id) {
              const id = typeof item.card_id === "string" ? Number.parseInt(item.card_id, 10) : item.card_id
              if (!isNaN(id)) {
                cardIds.add(id)
              }
            }
          })
        }
        if (block.type === "card-display-table" && block.data?.rows) {
          block.data.rows.forEach((row: any) => {
            if (row.cards && Array.isArray(row.cards)) {
              row.cards.forEach((card: any) => {
                if (card.id) {
                  const id = typeof card.id === "string" ? Number.parseInt(card.id, 10) : card.id
                  if (!isNaN(id)) {
                    cardIds.add(id)
                  }
                }
              })
            }
          })
        }
        if (block.type === "key-value-table" && block.data?.rows) {
          block.data.rows.forEach((row: any) => {
            if (row.valueType === "card" && row.cardValues && Array.isArray(row.cardValues)) {
              row.cardValues.forEach((cardValue: any) => {
                if (cardValue.id) {
                  const id = typeof cardValue.id === "string" ? Number.parseInt(cardValue.id, 10) : cardValue.id
                  if (!isNaN(id)) {
                    cardIds.add(id)
                  }
                }
              })
            }
          })
        }
      })

      if (cardIds.size > 0) {
        try {
          console.log("Fetching cards with IDs:", Array.from(cardIds))

          const { data: cards, error } = await supabase
            .from("cards")
            .select("id, name, image_url, game8_image_url")
            .in("id", Array.from(cardIds))

          if (error) {
            console.error("Error fetching cards:", error)
          } else if (cards) {
            console.log("Fetched card data:", cards)
            const cardMap: { [key: number]: CardData } = {}
            cards.forEach((card) => {
              cardMap[card.id] = card
            })
            setCardData(cardMap)
          }
        } catch (error) {
          console.error("Error loading card data:", error)
        }
      }
      setLoading(false)
    }

    fetchCardData()
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
                ? "text-3xl sm:text-4xl mb-6"
                : block.data.level === 2
                  ? "text-2xl sm:text-3xl mb-4 mt-8"
                  : "text-xl sm:text-2xl mb-3 mt-6"
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
            <div className="relative w-full">
              <Image
                src={block.data.url || "/placeholder.svg"}
                alt={block.data.alt || ""}
                width={800}
                height={400}
                className="rounded-lg w-full h-auto"
              />
            </div>
            {block.data.caption && <p className="text-sm text-slate-600 text-center mt-2">{block.data.caption}</p>}
          </div>
        )

      case "list":
        const ListTag = block.data.style === "numbered" ? "ol" : "ul"
        return (
          <ListTag
            key={index}
            className={`mb-4 space-y-2 ${
              block.data.style === "numbered" ? "list-decimal list-inside" : "list-disc list-inside"
            }`}
          >
            {block.data.items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-slate-700">
                {item}
              </li>
            ))}
          </ListTag>
        )

      case "table":
        return (
          <div key={index} className="my-6 overflow-x-auto">
            <Table>
              {block.data.headers && (
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    {block.data.headers.map((header, headerIndex) => (
                      <TableHead key={headerIndex} className="font-semibold text-slate-900">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
              )}
              <TableBody>
                {block.data.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="text-slate-700">
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )

      case "callout":
        const calloutIcons = {
          info: Info,
          warning: AlertTriangle,
          success: CheckCircle,
        }
        const CalloutIcon = calloutIcons[block.data.tone || "info"]

        return (
          <Alert
            key={index}
            className={`my-6 ${
              block.data.tone === "warning"
                ? "border-yellow-200 bg-yellow-50"
                : block.data.tone === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            <CalloutIcon className="h-4 w-4" />
            {block.data.title && <AlertTitle>{block.data.title}</AlertTitle>}
            <AlertDescription>{block.data.text}</AlertDescription>
          </Alert>
        )

      case "divider":
        return <Separator key={index} className="my-8" />

      case "button":
        return (
          <div key={index} className="my-6">
            <Button asChild variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
              <Link href={block.data.href}>
                {block.data.label}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )

      case "pickup":
        return (
          <Card key={index} className="my-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Star className="h-5 w-5 fill-current" />
                {block.data.title || "ピックアップ情報"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {block.data.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2">
                    <Star className="h-3 w-3 fill-current text-red-600" />
                    {item.href ? (
                      <Link href={item.href} className="text-red-700 hover:underline">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-red-700">{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )

      case "cards-table":
        return (
          <div key={index} className="my-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="font-semibold text-slate-900">カード</TableHead>
                  <TableHead className="font-semibold text-slate-900">説明</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-center">枚数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {block.data.items.map((item: any, itemIndex: number) => {
                  const cardId = typeof item.card_id === "string" ? Number.parseInt(item.card_id, 10) : item.card_id
                  const card = cardData[cardId]

                  return (
                    <TableRow key={itemIndex} className="align-middle">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {card ? (
                              <Image
                                src={getCardImageUrl(card) || "/placeholder.svg"}
                                alt={card.name}
                                width={80}
                                height={112}
                                className="rounded-lg object-cover border border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/no-card.png"
                                }}
                              />
                            ) : (
                              <div className="w-20 h-28 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-500 text-center px-2">
                                  {loading ? "読み込み中..." : "カード未取得"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 break-words">
                              {card?.name || item.name || `カードID: ${item.card_id}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 align-middle">{item.explanation || "-"}</TableCell>
                      <TableCell className="text-center align-middle font-medium">{item.quantity || 1}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )

      case "card-display-table":
        return (
          <div key={index} className="my-6 overflow-x-auto">
            <Table>
              <TableBody>
                {block.data.rows.map((row: any, rowIndex: number) => (
                  <TableRow key={row.id || rowIndex}>
                    <TableCell className="font-medium text-slate-900 bg-blue-50 w-1/4 align-top">
                      {row.header}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                        {row.cards && row.cards.length > 0 ? (
                          row.cards.map((cardRef: any, cardIndex: number) => {
                            const cardId = typeof cardRef.id === "string" ? Number.parseInt(cardRef.id, 10) : cardRef.id
                            const card = cardData[cardId]

                            return (
                              <div key={cardIndex} className="flex flex-col items-center">
                                <div className="aspect-[5/7] relative rounded border overflow-hidden bg-gray-100 w-full max-w-[80px]">
                                  {card ? (
                                    <Image
                                      src={getCardImageUrl(card) || "/placeholder.svg"}
                                      alt={card.name}
                                      fill
                                      className="object-cover"
                                      sizes="80px"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/no-card.png"
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-[10px] text-gray-500 text-center px-1">
                                        {loading ? "読み込み中..." : "未取得"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-1 text-[10px] text-gray-600 text-center truncate w-full max-w-[80px]">
                                  {card?.name || cardRef.name || `ID:${cardRef.id}`}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="col-span-full text-gray-500 text-sm">カードが選択されていません</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )

      case "key-value-table":
        return (
          <div key={index} className="my-6 overflow-x-auto">
            <Table>
              <TableBody>
                {block.data.rows.map((row: any, rowIndex: number) => (
                  <TableRow key={row.id || rowIndex}>
                    <TableCell className="font-medium text-slate-900 bg-blue-50 w-1/3 align-top">{row.key}</TableCell>
                    <TableCell className="py-4">
                      {row.valueType === "text" ? (
                        <span className="text-slate-700 whitespace-pre-wrap">{row.textValue || "-"}</span>
                      ) : row.valueType === "card" && row.cardValues && Array.isArray(row.cardValues) ? (
                        <div className="flex flex-wrap gap-3">
                          {row.cardValues.map((cardValue: any, cardIndex: number) => {
                            const cardId =
                              typeof cardValue.id === "string" ? Number.parseInt(cardValue.id, 10) : cardValue.id
                            const card = cardData[cardId]

                            return (
                              <div key={cardIndex} className="flex flex-col items-center space-y-1">
                                <div className="relative">
                                  {card ? (
                                    <Image
                                      src={getCardImageUrl(card) || "/placeholder.svg"}
                                      alt={card.name}
                                      width={80}
                                      height={112}
                                      className="rounded border border-gray-200 object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/no-card.png"
                                      }}
                                    />
                                  ) : (
                                    <div className="w-20 h-28 bg-gray-200 rounded border border-gray-200 flex items-center justify-center">
                                      <span className="text-xs text-gray-500 text-center px-2">
                                        {loading ? "読み込み中..." : "未取得"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-gray-900 text-center line-clamp-2 max-w-[80px]">
                                  {card?.name || cardValue.name || `ID:${cardValue.id}`}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )

      case "flexible-table":
        return (
          <div key={index} className="my-6">
            {block.data.title && <h3 className="text-lg font-semibold text-slate-900 mb-4">{block.data.title}</h3>}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    {block.data.columns.map((column: any, colIndex: number) => (
                      <TableHead
                        key={column.id || colIndex}
                        className="font-semibold text-slate-900"
                        style={{ width: column.width }}
                      >
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {block.data.rows.map((row: any, rowIndex: number) => (
                    <TableRow key={row.id || rowIndex}>
                      {block.data.columns.map((column: any, colIndex: number) => {
                        const cellValue = row.cells?.[column.id] || ""

                        return (
                          <TableCell key={column.id || colIndex} className="text-slate-700">
                            {column.type === "image" && cellValue ? (
                              <Image
                                src={cellValue || "/placeholder.svg"}
                                alt=""
                                width={60}
                                height={60}
                                className="rounded object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg"
                                }}
                              />
                            ) : column.type === "link" && cellValue ? (
                              <Link href={cellValue} className="text-blue-600 hover:underline">
                                {cellValue}
                              </Link>
                            ) : (
                              cellValue
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )

      default:
        console.warn(`Unknown block type: ${(block as any).type}`)
        return (
          <div key={index} className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              未対応のブロックタイプ: <code className="bg-yellow-100 px-2 py-1 rounded">{(block as any).type}</code>
            </p>
            <pre className="mt-2 text-xs text-yellow-700 overflow-auto">
              {JSON.stringify((block as any).data, null, 2)}
            </pre>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  return <div className="max-w-4xl mx-auto space-y-6">{blocks.map((block, index) => renderBlock(block, index))}</div>
}
