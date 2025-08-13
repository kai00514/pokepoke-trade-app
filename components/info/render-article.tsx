import Link from "next/link"
import Image from "next/image"
import { Star, ChevronRight, List, ArrowRight, AlertCircle, CheckCircle, Info } from "lucide-react"
import type { Block } from "@/lib/actions/info-articles"
import type { JSX } from "react"

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
      <div className="relative my-8">
        <div className="inline-block bg-slate-800 text-white px-6 py-3 rounded-t-lg font-semibold text-lg">{text}</div>
        <div className="h-1 bg-yellow-400 rounded-b-sm"></div>
        <div id={id} className="absolute -top-20"></div>
      </div>
    )
  }

  if (level === 3) {
    return (
      <div className="flex items-center gap-3 my-6">
        <div className="w-1 h-8 bg-slate-800 rounded-full"></div>
        <div className="bg-slate-200 text-slate-700 px-4 py-2 rounded-full font-medium">{text}</div>
        <div id={id} className="absolute -top-20"></div>
      </div>
    )
  }

  // H1 fallback
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  return (
    <Tag id={id} className="text-2xl font-bold text-slate-900 my-6">
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
    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden my-8">
      <div className="border-l-4 border-yellow-400 bg-white">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
          <List className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">目次</h3>
        </div>
        <nav className="px-4 py-3">
          <ul className="space-y-2">
            {headings.map((heading, index) => {
              const id = heading.data.anchorId || createSafeAnchorId(heading.data.text)
              const isH3 = heading.data.level === 3
              return (
                <li key={index} className={isH3 ? "ml-4" : ""}>
                  <Link
                    href={`#${id}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
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
    <div className="my-8 overflow-x-auto">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          {headers && headers.length > 0 && (
            <thead>
              <tr className="bg-slate-100">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b border-slate-200"
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
                  <td key={cellIndex} className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function renderPickup(block: Block & { type: "pickup" }) {
  const { title, items } = block.data

  return (
    <div className="my-8">
      <div className="bg-white border-2 border-red-200 rounded-lg overflow-hidden">
        <div className="bg-red-500 text-white px-4 py-2">
          <span className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {title || "ピックアップ情報"}
          </span>
        </div>
        <div className="p-4">
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <Star className="h-4 w-4 text-red-500 flex-shrink-0" />
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
        </div>
      </div>
    </div>
  )
}

function renderButton(block: Block & { type: "button" }) {
  const { label, href } = block.data

  return (
    <div className="my-8 flex justify-center">
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-8 py-4 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-2xl font-medium transition-colors"
      >
        <ArrowRight className="h-5 w-5" />
        {label}
      </Link>
    </div>
  )
}

function renderCallout(block: Block & { type: "callout" }) {
  const { tone, text } = block.data

  const styles = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <Info className="h-5 w-5 text-blue-600" />,
      text: "text-blue-800",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
      text: "text-yellow-800",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      text: "text-green-800",
    },
  }

  const style = styles[tone || "info"]

  return (
    <div className={`my-6 p-4 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        {style.icon}
        <p className={`text-sm ${style.text}`}>{text}</p>
      </div>
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
              <p key={index} className="text-slate-700 leading-relaxed my-4">
                {block.data.text}
              </p>
            )

          case "image":
            return (
              <div key={index} className="my-8">
                <div className="relative w-full bg-slate-100 rounded-lg overflow-hidden">
                  <Image
                    src={block.data.url || "/placeholder.svg"}
                    alt={block.data.alt || ""}
                    width={800}
                    height={400}
                    className="w-full h-auto object-cover"
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
              <ListTag key={index} className="my-4 space-y-1 text-slate-700">
                {block.data.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ListTag>
            )

          case "table":
            return <div key={index}>{renderTable(block)}</div>

          case "pickup":
            return <div key={index}>{renderPickup(block)}</div>

          case "button":
            return <div key={index}>{renderButton(block)}</div>

          case "callout":
            return <div key={index}>{renderCallout(block)}</div>

          case "divider":
            return <hr key={index} className="my-8 border-slate-200" />

          case "related-links":
            return (
              <div key={index} className="my-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3">関連リンク</h4>
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
              <div key={index} className="my-8 bg-white border border-slate-200 rounded-lg p-6">
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
            return (
              <div key={index} className="my-8">
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">カード名</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">枚数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.data.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className={itemIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {item.name || `Card ID: ${item.card_id}`}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.quantity || 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
