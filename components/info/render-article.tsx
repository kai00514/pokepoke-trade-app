"use client"

import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Star, Info, AlertTriangle, CheckCircle } from "lucide-react"
import type { Block } from "@/lib/actions/info-articles"
import type { JSX } from "react"

interface RenderArticleProps {
  blocks: Block[]
}

export default function RenderArticle({ blocks }: RenderArticleProps) {
  const renderBlock = (block: Block) => {
    switch (block.type) {
      case "heading":
        const HeadingTag = `h${block.data.level}` as keyof JSX.IntrinsicElements
        const headingClasses = {
          1: "text-3xl font-bold text-slate-900 mb-6",
          2: "text-2xl font-semibold text-slate-800 mb-4",
          3: "text-xl font-medium text-slate-700 mb-3",
        }
        return (
          <HeadingTag
            key={`heading-${block.display_order}`}
            id={block.data.anchorId}
            className={headingClasses[block.data.level]}
          >
            {block.data.text}
          </HeadingTag>
        )

      case "paragraph":
        return (
          <p key={`paragraph-${block.display_order}`} className="text-slate-700 leading-relaxed mb-4">
            {block.data.text}
          </p>
        )

      case "image":
        return (
          <div key={`image-${block.display_order}`} className="my-6">
            <Image
              src={block.data.url || "/placeholder.svg"}
              alt={block.data.alt || ""}
              width={800}
              height={400}
              className="rounded-lg shadow-sm w-full h-auto"
              style={{ aspectRatio: block.data.aspect || "auto" }}
            />
            {block.data.caption && <p className="text-sm text-slate-500 text-center mt-2">{block.data.caption}</p>}
          </div>
        )

      case "list":
        const ListTag = block.data.style === "numbered" ? "ol" : "ul"
        const listClasses = block.data.style === "numbered" ? "list-decimal" : "list-disc"
        return (
          <ListTag key={`list-${block.display_order}`} className={`${listClasses} list-inside mb-4 space-y-1`}>
            {block.data.items.map((item, index) => (
              <li key={index} className="text-slate-700">
                {item}
              </li>
            ))}
          </ListTag>
        )

      case "table":
        return (
          <div key={`table-${block.display_order}`} className="my-6 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 rounded-lg">
              {block.data.headers && (
                <thead>
                  <tr className="bg-blue-50">
                    {block.data.headers.map((header, index) => (
                      <th
                        key={index}
                        className="border border-slate-300 px-4 py-2 text-left font-semibold text-slate-700"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {block.data.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-slate-300 px-4 py-2 text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case "toc":
        return (
          <Card key={`toc-${block.display_order}`} className="my-6 bg-slate-50 text-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-800">目次</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {block.data.items.map((item, index) => (
                  <li key={index}>
                    {item.href ? (
                      <Link href={item.href} className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-slate-700 text-sm">{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )

      case "latest-info":
        return (
          <Card key={`latest-info-${block.display_order}`} className="my-6 border-red-200 bg-red-50 text-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-red-800 flex items-center gap-2">
                <Star className="h-4 w-4" />
                {block.data.title || "最新情報"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1">
                {block.data.items.map((item, index) => (
                  <li key={index}>
                    {item.href ? (
                      <Link href={item.href} className="text-red-700 hover:text-red-900 hover:underline text-sm">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-red-700 text-sm">{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )

      case "related-links":
        return (
          <Card key={`related-links-${block.display_order}`} className="my-6 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-800">関連リンク</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {block.data.items.map((item, index) => (
                  <li key={index}>
                    <Link href={item.href} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )

      case "divider":
        return <Separator key={`divider-${block.display_order}`} className="my-8" />

      case "callout":
        const calloutIcons = {
          info: Info,
          warning: AlertTriangle,
          success: CheckCircle,
        }
        const calloutStyles = {
          info: "border-blue-200 bg-blue-50 text-blue-800",
          warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
          success: "border-green-200 bg-green-50 text-green-800",
        }
        const IconComponent = calloutIcons[block.data.tone || "info"]
        return (
          <Alert key={`callout-${block.display_order}`} className={`my-6 ${calloutStyles[block.data.tone || "info"]}`}>
            <IconComponent className="h-4 w-4" />
            {block.data.title && <h4 className="font-semibold mb-1">{block.data.title}</h4>}
            <AlertDescription>{block.data.text}</AlertDescription>
          </Alert>
        )

      case "evaluation":
        return (
          <Card key={`evaluation-${block.display_order}`} className="my-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-purple-800">デッキ評価</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {block.data.tier_rank && (
                <div className="flex justify-between">
                  <span className="font-medium">ティアランク:</span>
                  <Badge variant="outline">{block.data.tier_rank}</Badge>
                </div>
              )}
              {block.data.max_damage && (
                <div className="flex justify-between">
                  <span className="font-medium">最大ダメージ:</span>
                  <span>{block.data.max_damage}</span>
                </div>
              )}
              {block.data.build_difficulty && (
                <div className="flex justify-between">
                  <span className="font-medium">構築難易度:</span>
                  <span>{block.data.build_difficulty}</span>
                </div>
              )}
              {block.data.stat_accessibility && (
                <div className="flex justify-between">
                  <span className="font-medium">アクセシビリティ:</span>
                  <span>{block.data.stat_accessibility}</span>
                </div>
              )}
              {block.data.stat_stability && (
                <div className="flex justify-between">
                  <span className="font-medium">安定性:</span>
                  <span>{block.data.stat_stability}</span>
                </div>
              )}
              {block.data.eval_value !== undefined && block.data.eval_count !== undefined && (
                <div className="flex justify-between">
                  <span className="font-medium">評価:</span>
                  <span>
                    {block.data.eval_value}/5 ({block.data.eval_count}件)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "cards-table":
        return (
          <Card key={`cards-table-${block.display_order}`} className="my-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800">
                {block.data.headers?.card || "カード一覧"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {block.data.items.map((item, index) => (
                  <div key={index} className="flex flex-col items-center min-w-0">
                    <div className="relative w-full aspect-[5/7] mb-2">
                      <Image
                        src={`/ceholder-svg-key-7nvc3-height-140-width-100-text-c.jpg?key=7nvc3&height=140&width=100&text=Card+${item.card_id}`}
                        alt={item.name || `Card ${item.card_id}`}
                        fill
                        className="rounded-lg object-cover"
                        sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                      />
                    </div>
                    {item.name && (
                      <p className="text-xs text-center text-slate-700 font-medium w-full truncate">{item.name}</p>
                    )}
                    {item.quantity && item.quantity > 1 && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        ×{item.quantity}
                      </Badge>
                    )}
                    {item.explanation && (
                      <p className="text-xs text-slate-500 text-center mt-1 w-full line-clamp-2">{item.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "card-display-table":
        return (
          <Card key={`card-display-table-${block.display_order}`} className="my-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                {block.data.rows.map((row) => (
                  <div key={row.id} className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                      {row.header}
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {row.cards.map((card) => (
                        <div key={card.id} className="flex flex-col items-center min-w-0">
                          <div className="relative w-full aspect-[5/7] mb-2">
                            <Image
                              src={card.imageUrl || `/placeholder.svg?height=140&width=100&text=Card+${card.id}`}
                              alt={card.name}
                              fill
                              className="rounded-lg object-cover"
                              sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                            />
                          </div>
                          <p className="text-xs text-center text-slate-700 font-medium w-full truncate">{card.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "pickup":
        return (
          <Card key={`pickup-${block.display_order}`} className="my-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-red-800 flex items-center gap-2">
                <Star className="h-4 w-4" />
                {block.data.title || "ピックアップ情報"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {block.data.items.map((item, index) => (
                  <li key={index}>
                    {item.href ? (
                      <Link href={item.href} className="text-red-700 hover:text-red-900 hover:underline">
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

      case "button":
        return (
          <div key={`button-${block.display_order}`} className="my-6 text-center">
            <Button asChild variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent">
              <Link href={block.data.href}>{block.data.label}</Link>
            </Button>
          </div>
        )

      case "key-value-table":
        return (
          <Card key={`key-value-table-${block.display_order}`} className="my-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                {block.data.rows.map((row) => (
                  <div key={row.id} className="grid grid-cols-2 gap-4 items-start">
                    <div className="font-medium text-slate-700 bg-slate-50 p-3 rounded">{row.key}</div>
                    <div className="p-3">
                      {row.valueType === "text" && row.textValue && (
                        <span className="text-slate-700">{row.textValue}</span>
                      )}
                      {row.valueType === "card" && row.cardValues && (
                        <div className="grid grid-cols-3 gap-2">
                          {row.cardValues.map((card) => (
                            <div key={card.id} className="flex flex-col items-center min-w-0">
                              <div className="relative w-full aspect-[5/7] mb-1">
                                <Image
                                  src={card.imageUrl || `/placeholder.svg?height=70&width=50&text=Card+${card.id}`}
                                  alt={card.name}
                                  fill
                                  className="rounded object-cover"
                                  sizes="50px"
                                />
                              </div>
                              <p className="text-xs text-center text-slate-700 w-full truncate">{card.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "flexible-table":
        return (
          <Card key={`flexible-table-${block.display_order}`} className="my-6">
            {block.data.title && (
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">{block.data.title}</CardTitle>
              </CardHeader>
            )}
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-50">
                      {block.data.columns.map((column) => (
                        <th
                          key={column.id}
                          className="border border-slate-300 px-4 py-2 text-left font-semibold text-slate-700"
                          style={{ width: column.width }}
                        >
                          {column.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.data.rows.map((row, rowIndex) => (
                      <tr key={row.id} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        {block.data.columns.map((column) => (
                          <td key={column.id} className="border border-slate-300 px-4 py-2 text-slate-700">
                            {column.type === "image" ? (
                              <Image
                                src={row.cells[column.id] || "/placeholder.svg"}
                                alt=""
                                width={50}
                                height={50}
                                className="rounded"
                              />
                            ) : column.type === "link" ? (
                              <Link href={row.cells[column.id] || "#"} className="text-blue-600 hover:underline">
                                {row.cells[column.id]}
                              </Link>
                            ) : (
                              row.cells[column.id]
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )

      case "media-gallery":
        return (
          <Card key={`media-gallery-${block.display_order}`} className="my-6">
            {block.data.title && (
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">{block.data.title}</CardTitle>
              </CardHeader>
            )}
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {block.data.items.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="relative aspect-square">
                      <Image
                        src={item.url || "/placeholder.svg"}
                        alt={item.alt || ""}
                        fill
                        className="rounded-lg object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                    </div>
                    {item.caption && <p className="text-sm text-slate-600 text-center">{item.caption}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "rich-text":
        return (
          <div
            key={`rich-text-${block.display_order}`}
            className="my-6"
            style={block.data.style}
            dangerouslySetInnerHTML={{
              __html: block.data.format === "html" ? block.data.content : block.data.content,
            }}
          />
        )

      default:
        return null
    }
  }

  return <div className="prose prose-slate max-w-none">{blocks.map((block) => renderBlock(block))}</div>
}
