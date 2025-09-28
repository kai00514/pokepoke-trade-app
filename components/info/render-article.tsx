"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Star, ExternalLink, Info, AlertTriangle, CheckCircle, List, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Block } from "@/lib/actions/info-articles"

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
        if (block.data.level === 1) {
          return (
            <div key={index} className="my-4">
              <h1
                id={block.data.anchorId}
                className="text-lg sm:text-xl font-bold text-slate-900 mb-3 pb-2 border-b-4 border-blue-600 bg-gradient-to-r from-blue-50 to-transparent pl-4 pr-2 py-2 rounded-l-lg shadow-sm"
              >
                {block.data.text}
              </h1>
            </div>
          )
        } else if (block.data.level === 2) {
          return (
            <div key={index} className="my-3">
              <h2
                id={block.data.anchorId}
                className="text-base sm:text-lg font-bold text-white mb-2 mt-4 relative pl-6 py-2 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-orange-600 before:rounded-r-sm bg-orange-500 border-l-4 border-orange-600 rounded-r-md shadow-md"
              >
                {block.data.text}
              </h2>
            </div>
          )
        } else {
          return (
            <div key={index} className="my-2">
              <h3
                id={block.data.anchorId}
                className="text-sm sm:text-base font-semibold text-white mb-2 mt-3 relative pl-4 py-1.5 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-green-600 before:rounded-r-sm bg-green-500 border-l-4 border-green-600 rounded-r shadow-sm"
              >
                {block.data.text}
              </h3>
            </div>
          )
        }

      case "paragraph":
        return (
          <p key={index} className="text-slate-700 leading-relaxed mb-4 text-base">
            {block.data.text}
          </p>
        )

      case "image":
        return (
          <div key={index} className="my-6">
            <div className="relative w-full rounded-lg overflow-hidden shadow-md">
              <Image
                src={block.data.url || "/placeholder.svg"}
                alt={block.data.alt || ""}
                width={800}
                height={400}
                className="w-full h-auto"
              />
            </div>
            {block.data.caption && (
              <p className="text-sm text-slate-600 text-center mt-3 italic bg-slate-50 p-2 rounded">
                {block.data.caption}
              </p>
            )}
          </div>
        )

      case "list":
        if (block.data.style === "numbered") {
          return (
            <ol
              key={index}
              className="mb-6 space-y-2 list-decimal list-inside bg-slate-50 p-4 rounded-lg border-l-4 border-blue-300"
            >
              {block.data.items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-slate-700 pl-2">
                  {item}
                </li>
              ))}
            </ol>
          )
        } else {
          return (
            <ul
              key={index}
              className="mb-6 space-y-2 list-disc list-inside bg-slate-50 p-4 rounded-lg border-l-4 border-blue-300"
            >
              {block.data.items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-slate-700 pl-2">
                  {item}
                </li>
              ))}
            </ul>
          )
        }

      case "table":
        return (
          <div key={index} className="my-6 overflow-x-auto rounded-lg shadow-md">
            <Table className="border border-slate-200">
              {block.data.headers && (
                <TableHeader>
                  <TableRow className="bg-blue-100 border-b-2 border-blue-200">
                    {block.data.headers.map((header, headerIndex) => (
                      <TableHead key={headerIndex} className="font-semibold text-slate-900 py-4 px-4 text-center">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
              )}
              <TableBody>
                {block.data.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-blue-25 border-b border-slate-100">
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="text-slate-700 py-3 px-4 text-center">
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
            className={`my-6 border-l-4 shadow-md ${
              block.data.tone === "warning"
                ? "border-yellow-400 bg-yellow-50 border-l-yellow-400"
                : block.data.tone === "success"
                  ? "border-green-400 bg-green-50 border-l-green-400"
                  : "border-blue-400 bg-blue-50 border-l-blue-400"
            }`}
          >
            <CalloutIcon className="h-5 w-5" />
            {block.data.title && <AlertTitle className="text-lg font-semibold">{block.data.title}</AlertTitle>}
            <AlertDescription className="text-base mt-2">{block.data.text}</AlertDescription>
          </Alert>
        )

      case "divider":
        return <Separator key={index} className="my-8 border-t-2 border-blue-200" />

      case "button":
        return (
          <div key={index} className="my-6 text-center">
            <Button
              asChild
              variant="outline"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent px-6 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Link href={block.data.href}>
                {block.data.label}
                <ExternalLink className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        )

      case "pickup":
        return (
          <Card key={index} className="my-6 border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-25 shadow-lg">
            <CardHeader className="bg-red-100 border-b border-red-200">
              <CardTitle className="flex items-center gap-3 text-red-900 text-xl">
                <Star className="h-6 w-6 fill-current text-red-600" />
                {block.data.title || "ピックアップ情報"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-3">
                {block.data.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-3">
                    <Star className="h-4 w-4 fill-current text-red-600 flex-shrink-0" />
                    {item.href ? (
                      <Link href={item.href} className="text-red-800 hover:text-red-900 underline font-medium">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-red-800 font-medium">{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )

      case "latest-info":
        return (
          <div key={index} className="my-3 border-2 border-red-400 rounded-md bg-red-50 shadow-sm">
            <div className="bg-red-500 text-white px-3 py-1.5 rounded-t-md">
              <h3 className="font-bold text-xs">{block.data.title || "最新情報"}</h3>
            </div>
            <div className="p-2 bg-white rounded-b-md">
              {block.data.items && block.data.items.length > 0 ? (
                <ul className="space-y-1">
                  {block.data.items.map((item: any, itemIndex: number) => (
                    <li key={itemIndex} className="flex items-center gap-1.5">
                      <span className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {itemIndex + 1}
                      </span>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs leading-tight transition-colors hover:underline decoration-1 underline-offset-1 flex-1"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span className="text-blue-600 font-medium text-xs leading-tight flex-1">{item.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">情報項目が設定されていません</p>
              )}
            </div>
          </div>
        )

      case "cards-table":
        return (
          <div key={index} className="my-6 border-2 border-slate-200 rounded-lg overflow-hidden bg-white shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100 border-b-2 border-blue-200">
                  <TableHead className="font-bold text-slate-900 py-4 px-4 border-r border-blue-200 text-center">
                    カード
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 py-4 px-4 border-r border-blue-200 text-center">
                    説明
                  </TableHead>
                  <TableHead className="font-bold text-slate-900 py-4 px-4 text-center">枚数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {block.data.items.map((item: any, itemIndex: number) => {
                  const cardId = typeof item.card_id === "string" ? Number.parseInt(item.card_id, 10) : item.card_id
                  const card = cardData[cardId]

                  return (
                    <TableRow key={itemIndex} className="border-b border-slate-100 hover:bg-blue-25">
                      <TableCell className="py-4 px-4 border-r border-slate-100">
                        <div className="flex items-center gap-3 justify-center">
                          <div className="flex-shrink-0">
                            <div className="aspect-[5/7] relative rounded-md border-2 border-gray-200 overflow-hidden bg-gray-100 w-[50px] sm:w-[60px] md:w-[70px] shadow-md">
                              {card ? (
                                <Image
                                  src={getCardImageUrl(card) || "/placeholder.svg"}
                                  alt={card.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 50px, (max-width: 768px) 60px, 70px"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "/no-card.png"
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-[8px] text-gray-500 text-center px-1">
                                    {loading ? "読み込み中..." : "カード未取得"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 text-sm leading-tight truncate max-w-[120px]">
                              {card?.name || item.name || `カードID: ${item.card_id}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 py-4 px-4 border-r border-slate-100 text-sm text-center">
                        {item.explanation || "-"}
                      </TableCell>
                      <TableCell className="text-center py-4 px-4 font-bold text-lg text-blue-600">
                        {item.quantity || 1}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )

      case "card-display-table":
        return (
          <div key={index} className="my-6 border-2 border-slate-200 rounded-lg overflow-hidden bg-white shadow-lg">
            <Table>
              <TableBody>
                {block.data.rows.map((row: any, rowIndex: number) => (
                  <TableRow key={row.id || rowIndex} className="border-b border-slate-100 hover:bg-blue-25">
                    <TableCell className="font-bold text-slate-900 bg-blue-100 py-4 px-4 border-r-2 border-blue-200 w-auto whitespace-nowrap align-top text-sm">
                      {row.header}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div className="flex flex-wrap gap-2 justify-start">
                        {row.cards && row.cards.length > 0 ? (
                          row.cards.map((cardRef: any, cardIndex: number) => {
                            const cardId = typeof cardRef.id === "string" ? Number.parseInt(cardRef.id, 10) : cardRef.id
                            const card = cardData[cardId]

                            return (
                              <div key={cardIndex} className="flex flex-col items-center">
                                <div className="aspect-[5/7] relative rounded-md border-2 border-gray-200 overflow-hidden bg-gray-100 w-[50px] sm:w-[60px] md:w-[70px] shadow-md hover:shadow-lg transition-shadow">
                                  {card ? (
                                    <Image
                                      src={getCardImageUrl(card) || "/placeholder.svg"}
                                      alt={card.name}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 50px, (max-width: 768px) 60px, 70px"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/no-card.png"
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-[8px] text-gray-500 text-center px-1">
                                        {loading ? "読み込み中..." : "未取得"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-1 text-[8px] text-gray-700 text-center truncate w-[50px] sm:w-[60px] md:w-[70px] leading-tight font-medium">
                                  {card?.name || cardRef.name || `ID:${cardRef.id}`}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="w-full text-gray-500 text-sm py-4 text-center italic">
                            カードが選択されていません
                          </div>
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
          <div key={index} className="my-6 border-2 border-slate-200 rounded-lg overflow-hidden bg-white shadow-lg">
            <Table>
              <TableBody>
                {block.data.rows.map((row: any, rowIndex: number) => (
                  <TableRow key={row.id || rowIndex} className="border-b border-slate-100 hover:bg-blue-25">
                    <TableCell className="font-bold text-slate-900 bg-blue-100 py-4 px-4 border-r-2 border-blue-200 w-auto whitespace-nowrap align-top text-sm">
                      {row.key}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      {row.valueType === "text" ? (
                        <span className="text-slate-700 whitespace-pre-wrap text-sm">{row.textValue || "-"}</span>
                      ) : row.valueType === "card" && row.cardValues && Array.isArray(row.cardValues) ? (
                        <div className="flex flex-wrap gap-2 justify-start">
                          {row.cardValues.map((cardValue: any, cardIndex: number) => {
                            const cardId =
                              typeof cardValue.id === "string" ? Number.parseInt(cardValue.id, 10) : cardValue.id
                            const card = cardData[cardId]

                            return (
                              <div key={cardIndex} className="flex flex-col items-center space-y-1">
                                <div className="aspect-[5/7] relative rounded-md border-2 border-gray-200 overflow-hidden bg-gray-100 w-[50px] sm:w-[60px] md:w-[70px] shadow-md hover:shadow-lg transition-shadow">
                                  {card ? (
                                    <Image
                                      src={getCardImageUrl(card) || "/placeholder.svg"}
                                      alt={card.name}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 640px) 50px, (max-width: 768px) 60px, 70px"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = "/no-card.png"
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <span className="text-xs text-gray-500 text-center px-1">
                                        {loading ? "読み込み中..." : "未取得"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-[8px] font-medium text-gray-900 text-center line-clamp-2 w-[50px] sm:w-[60px] md:w-[70px] leading-tight">
                                  {card?.name || cardValue.name || `ID:${cardValue.id}`}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm italic">-</span>
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
            {block.data.title && (
              <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b border-blue-200 bg-blue-50 p-3 rounded-t-lg">
                {block.data.title}
              </h3>
            )}
            <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white shadow-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-100 border-b-2 border-blue-200">
                    {block.data.columns.map((column: any, colIndex: number) => (
                      <TableHead
                        key={column.id || colIndex}
                        className="font-bold text-slate-900 py-4 px-4 border-r border-blue-200 last:border-r-0 text-center"
                        style={{ width: column.width }}
                      >
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {block.data.rows.map((row: any, rowIndex: number) => (
                    <TableRow key={row.id || rowIndex} className="border-b border-slate-100 hover:bg-blue-25">
                      {block.data.columns.map((column: any, colIndex: number) => {
                        const cellValue = row.cells?.[column.id] || ""

                        return (
                          <TableCell
                            key={column.id || colIndex}
                            className="text-slate-700 py-3 px-4 border-r border-slate-100 last:border-r-0 text-sm text-center"
                          >
                            {column.type === "image" && cellValue ? (
                              <Image
                                src={cellValue || "/placeholder.svg"}
                                alt=""
                                width={50}
                                height={50}
                                className="rounded-md object-cover shadow-md mx-auto"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg"
                                }}
                              />
                            ) : column.type === "link" && cellValue ? (
                              <Link
                                href={cellValue}
                                className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                              >
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

      case "toc":
        return (
          <div
            key={index}
            className="my-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-md shadow-sm"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-t-md">
              <h3 className="font-bold text-xs flex items-center gap-2">
                <List className="h-4 w-4" />
                目次
              </h3>
            </div>
            <div className="p-2 bg-white rounded-b-md">
              {block.data.items && block.data.items.length > 0 ? (
                <nav className="space-y-1.5">
                  {block.data.items.map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="flex items-center gap-2 group">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md w-5 h-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                        {itemIndex + 1}
                      </div>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-slate-700 hover:text-blue-600 font-medium text-xs leading-tight transition-colors hover:underline decoration-1 underline-offset-1 flex-1"
                        >
                          {item.label}
                        </a>
                      ) : (
                        <span className="text-slate-700 font-medium text-xs leading-tight flex-1">{item.label}</span>
                      )}
                    </div>
                  ))}
                </nav>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">目次項目が設定されていません</p>
                </div>
              )}
            </div>
          </div>
        )

      case "related-links":
        return (
          <div key={index} className="my-6 p-6 bg-slate-50 rounded-lg border-2 border-slate-200 shadow-md">
            <h3 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-blue-600" />
              関連リンク
            </h3>
            <ul className="space-y-3">
              {block.data.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Link
                    href={item.href}
                    className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 font-medium transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )

      case "evaluation":
        return (
          <Card key={index} className="my-6 border-2 border-blue-300 shadow-lg">
            <CardHeader className="bg-blue-100 border-b-2 border-blue-200">
              <CardTitle className="text-xl font-bold text-blue-900">デッキ評価</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                {block.data.tier_rank && (
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-slate-700 font-medium">ティアランク:</span>
                    <span className="font-bold text-blue-700 text-lg">{block.data.tier_rank}</span>
                  </div>
                )}
                {block.data.max_damage && (
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-slate-700 font-medium">最大ダメージ:</span>
                    <span className="font-bold text-red-700 text-lg">{block.data.max_damage}</span>
                  </div>
                )}
                {block.data.build_difficulty && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-slate-700 font-medium">構築難易度:</span>
                    <span className="font-bold text-yellow-700 text-lg">{block.data.build_difficulty}</span>
                  </div>
                )}
                {block.data.stat_accessibility && (
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-slate-700 font-medium">アクセス性:</span>
                    <span className="font-bold text-green-700 text-lg">{block.data.stat_accessibility}</span>
                  </div>
                )}
                {block.data.stat_stability && (
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-slate-700 font-medium">安定性:</span>
                    <span className="font-bold text-purple-700 text-lg">{block.data.stat_stability}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case "media-gallery":
        return (
          <div key={index} className="my-6">
            {block.data.title && (
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-blue-200 bg-blue-50 p-3 rounded-t-lg">
                {block.data.title}
              </h3>
            )}
            <div
              className={`grid gap-4 ${
                block.data.layout === "carousel"
                  ? "grid-cols-1"
                  : `grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(block.data.columns || 3, 4)}`
              }`}
            >
              {block.data.items.map((item: any, itemIndex: number) => (
                <div
                  key={item.id || itemIndex}
                  className="relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white"
                >
                  <div className="aspect-video w-full">
                    <Image
                      src={item.url || "/placeholder.svg"}
                      alt={item.alt || ""}
                      fill
                      className="object-contain w-full h-full"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg"
                      }}
                    />
                  </div>
                  {item.caption && (
                    <div className="p-3 bg-slate-50">
                      <p className="text-sm text-slate-600 text-center font-medium">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case "rich-text":
        return (
          <div
            key={index}
            className="my-6 p-4 rounded-lg border border-slate-200 bg-white shadow-sm"
            style={{
              fontSize: block.data.style?.fontSize,
              color: block.data.style?.color,
              backgroundColor: block.data.style?.backgroundColor,
              textAlign: block.data.style?.textAlign,
            }}
          >
            {block.data.format === "html" ? (
              <div dangerouslySetInnerHTML={{ __html: block.data.content }} />
            ) : (
              <div className="whitespace-pre-wrap">{block.data.content}</div>
            )}
          </div>
        )

      default:
        console.warn(`Unknown block type: ${(block as any).type}`)
        return (
          <div key={index} className="my-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-md">
            <p className="text-yellow-800 font-semibold">
              未対応のブロックタイプ:{" "}
              <code className="bg-yellow-100 px-2 py-1 rounded font-mono">{(block as any).type}</code>
            </p>
            <pre className="mt-2 text-xs text-yellow-700 overflow-auto bg-yellow-100 p-2 rounded">
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
          <div className="h-6 bg-blue-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  return <div className="max-w-4xl mx-auto space-y-6">{blocks.map((block, index) => renderBlock(block, index))}</div>
}
