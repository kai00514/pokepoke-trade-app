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
      <div className="relative my-5">
        {" "}
        {/* 外側の上下余白＝均等＆控えめ */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-3 py-[5px] rounded-lg shadow-lg border-l-4 border-blue-500">
          <h2 className="m-0 text-lg font-bold text-white leading-loose">{text}</h2>
        </div>
        <div id={id} className="absolute -top-16"></div>
      </div>
    )
  }

  if (level === 3) {
    return (
      <div className="relative my-3">
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
    <div className="overflow-x-auto">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-1 mt-0 leading-snug">
        <table className="w-full border-collapse border border-slate-200">
          {headers && headers.length > 0 && (
            <thead>
              <tr className="bg-gray-100 leading-snug">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-0 text-left text-sm font-semibold text-slate-700 border-b border-slate-200 border-r border-slate-200 last:border-r-0"
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
                    className="px-4 py-1 text-sm text-slate-600 border-b border-slate-100 border-r border-slate-200 last:border-r-0"
                  >
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
    <div className="my-2">
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
    <div className="my-2 flex justify-center">
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
  const { tone, text, title } = block.data

  const styles = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />,
      text: "text-blue-800",
      label: "情報",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      icon: <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />,
      text: "text-yellow-800",
      label: "警告",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />,
      text: "text-green-800",
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
          <p className={`text-sm ${style.text} leading-relaxed`}>{text}</p>
        </div>
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
              <p key={index} className="text-slate-700 leading-relaxed my-2">
                {block.data.text.split("\\n").map((line, lineIndex, lines) => (
                  <span key={lineIndex}>
                    {line}
                    {lineIndex < lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            )

          case "image":
            return (
              <div key={index} className="my-2">
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

          case "pickup":
            return <div key={index}>{renderPickup(block)}</div>

          case "button":
            return <div key={index}>{renderButton(block)}</div>

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
            return (
              <div key={index} className="mt-0 mb-1">
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-1 text-left text-sm font-semibold text-slate-700">カード名</th>
                        <th className="px-4 py-1 text-left text-sm font-semibold text-slate-700">枚数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.data.items.map((item, itemIndex) => (
                        <tr key={itemIndex} className={itemIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-1 text-sm text-slate-700">
                            {item.name || `Card ID: ${item.card_id}`}
                          </td>
                          <td className="px-4 py-1 text-sm text-slate-600">{item.quantity || 1}</td>
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
