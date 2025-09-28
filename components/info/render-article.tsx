"use client"

import React from "react"
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
  type?: string
}

async function getCardData(cardIds: (string | number)[]): Promise<CardData[]> {
  try {
    const supabase = createClient()
    const numericIds = cardIds
      .map((id) => (typeof id === "string" ? Number.parseInt(id, 10) : id))
      .filter((id) => !isNaN(id))

    if (numericIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from("cards")
      .select("id,name,image_url,game8_image_url")
      .in("id", numericIds)

    if (error) {
      console.error("Error fetching card data:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getCardData:", error)
    return []
  }
}

function getCardImageUrl(card: CardData): string {
  // Game8の画像URLを優先、なければimage_urlを使用
  if (card.game8_image_url) {
    return card.game8_image_url
  }
  if (card.image_url) {
    return card.image_url
  }
  return "/no-card.png"
}

function CardImage({ card, className = "" }: { card: CardData; className?: string }) {
  const imageUrl = getCardImageUrl(card)

  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageUrl || "/placeholder.svg"}
        alt={card.name || "カード"}
        width={120}
        height={168}
        className="rounded-lg object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = "/no-card.png"
        }}
      />
    </div>
  )
}

export default function RenderArticle({ blocks }: RenderArticleProps) {
  const [cardDataCache, setCardDataCache] = React.useState<Map<string, CardData[]>>(new Map())

  const fetchCardData = React.useCallback(
    async (cardIds: (string | number)[]) => {
      const cacheKey = cardIds.sort().join(",")

      if (cardDataCache.has(cacheKey)) {
        return cardDataCache.get(cacheKey)!
      }

      const data = await getCardData(cardIds)
      setCardDataCache((prev) => new Map(prev).set(cacheKey, data))
      return data
    },
    [cardDataCache],
  )

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
        return <CardsTableBlock key={index} block={block} fetchCardData={fetchCardData} />

      case "card-display-table":
        return <CardDisplayTableBlock key={index} block={block} />

      case "key-value-table":
        return <KeyValueTableBlock key={index} block={block} />

      case "flexible-table":
        return <FlexibleTableBlock key={index} block={block} />

      default:
        console.warn(`Unknown block type: ${(block as any).type}`)
        return null
    }
  }

  return <div className="max-w-4xl mx-auto space-y-6">{blocks.map((block, index) => renderBlock(block, index))}</div>
}

// CardsTableBlock component
function CardsTableBlock({
  block,
  fetchCardData,
}: {
  block: Extract<Block, { type: "cards-table" }>
  fetchCardData: (cardIds: (string | number)[]) => Promise<CardData[]>
}) {
  const [cards, setCards] = React.useState<CardData[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadCards = async () => {
      try {
        const cardIds = block.data.items.map((item) => item.card_id)
        const cardData = await fetchCardData(cardIds)
        setCards(cardData)
      } catch (error) {
        console.error("Error loading cards:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [block.data.items, fetchCardData])

  if (loading) {
    return (
      <div className="my-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const headers = block.data.headers || {
    card: "カード",
    explanation: "説明",
    quantity: "枚数",
  }

  return (
    <div className="my-6 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-50">
            <TableHead className="font-semibold text-slate-900 w-auto">{headers.card}</TableHead>
            {headers.explanation && (
              <TableHead className="font-semibold text-slate-900">{headers.explanation}</TableHead>
            )}
            {headers.quantity && (
              <TableHead className="font-semibold text-slate-900 w-20 text-center">{headers.quantity}</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {block.data.items.map((item, index) => {
            const card = cards.find((c) => c.id === Number(item.card_id))

            return (
              <TableRow key={index} className="align-middle">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    {card ? (
                      <CardImage card={card} className="flex-shrink-0" />
                    ) : (
                      <div className="w-[120px] h-[168px] bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-500 text-center px-2">カードIDがありません</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 break-words">
                        {card?.name || item.name || `カードID: ${item.card_id}`}
                      </p>
                    </div>
                  </div>
                </TableCell>
                {headers.explanation && (
                  <TableCell className="text-slate-700 align-middle">{item.explanation || "-"}</TableCell>
                )}
                {headers.quantity && (
                  <TableCell className="text-center align-middle font-medium">{item.quantity}</TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// CardDisplayTableBlock component
function CardDisplayTableBlock({
  block,
}: {
  block: Extract<Block, { type: "card-display-table" }>
}) {
  return (
    <div className="my-6 overflow-x-auto">
      <Table>
        <TableBody>
          {block.data.rows.map((row, index) => (
            <TableRow key={row.id || index}>
              <TableCell className="font-medium text-slate-900 bg-blue-50 w-auto">{row.header}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {row.cards.map((card, cardIndex) => (
                    <div key={card.id || cardIndex} className="text-center">
                      <div className="w-16 h-22 bg-gray-200 rounded flex items-center justify-center mb-1">
                        {card.imageUrl ? (
                          <Image
                            src={card.imageUrl || "/placeholder.svg"}
                            alt={card.name}
                            width={64}
                            height={88}
                            className="rounded object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/no-card.png"
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-500">No Image</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 max-w-16 break-words">{card.name}</p>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// KeyValueTableBlock component
function KeyValueTableBlock({
  block,
}: {
  block: Extract<Block, { type: "key-value-table" }>
}) {
  return (
    <div className="my-6 overflow-x-auto">
      <Table>
        <TableBody>
          {block.data.rows.map((row, index) => (
            <TableRow key={row.id || index}>
              <TableCell className="font-medium text-slate-900 bg-blue-50 w-1/3">{row.key}</TableCell>
              <TableCell>
                {row.valueType === "text" ? (
                  <span className="text-slate-700">{row.textValue || "-"}</span>
                ) : row.valueType === "card" && row.cardValues ? (
                  <div className="flex flex-wrap gap-2">
                    {row.cardValues.map((card, cardIndex) => (
                      <div key={card.id || cardIndex} className="text-center">
                        <div className="w-20 h-28 bg-gray-200 rounded flex items-center justify-center mb-1">
                          {card.imageUrl ? (
                            <Image
                              src={card.imageUrl || "/placeholder.svg"}
                              alt={card.name}
                              width={80}
                              height={112}
                              className="rounded object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/no-card.png"
                              }}
                            />
                          ) : (
                            <span className="text-xs text-gray-500">No Image</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 max-w-20 break-words">{card.name}</p>
                      </div>
                    ))}
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
}

// FlexibleTableBlock component
function FlexibleTableBlock({
  block,
}: {
  block: Extract<Block, { type: "flexible-table" }>
}) {
  return (
    <div className="my-6">
      {block.data.title && <h3 className="text-lg font-semibold text-slate-900 mb-4">{block.data.title}</h3>}
      <div className="overflow-x-auto">
        <Table
          className={
            block.data.style === "striped"
              ? "table-striped"
              : block.data.style === "bordered"
                ? "border"
                : block.data.style === "compact"
                  ? "table-compact"
                  : ""
          }
        >
          <TableHeader>
            <TableRow className="bg-blue-50">
              {block.data.columns.map((column, index) => (
                <TableHead
                  key={column.id || index}
                  className="font-semibold text-slate-900"
                  style={{ width: column.width }}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {block.data.rows.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex}>
                {block.data.columns.map((column, colIndex) => {
                  const cellValue = row.cells[column.id] || ""

                  return (
                    <TableCell key={column.id || colIndex} className="text-slate-700">
                      {column.type === "image" && cellValue ? (
                        <Image
                          src={cellValue || "/placeholder.svg"}
                          alt=""
                          width={60}
                          height={60}
                          className="rounded object-cover"
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
}
