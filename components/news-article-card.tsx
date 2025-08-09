"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type NewsArticle = {
  id: string
  title: string
  date: string
  summary: string
  category: string
  /**
   * Tailwind color name for badge, e.g. "emerald" | "sky" | "amber"
   * Fallback goes to blue.
   */
  categoryColor?: string
  url: string
}

interface NewsArticleCardProps {
  article: NewsArticle
  index?: number
}

/**
 * Blue-themed News card used on /info.
 * Replaces purple with blue:
 * - Title hover: group-hover:text-blue-600
 * - Card hover border: hover:border-blue-300
 * - "Read more" link: text-blue-600 hover:text-blue-700 focus:ring-blue-500
 */
export default function NewsArticleCard({ article, index = 0 }: NewsArticleCardProps) {
  const badge = getBadgeClasses(article.categoryColor)

  return (
    <motion.article
      className="group relative h-full rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            badge.bg,
            badge.text,
          )}
        >
          {article.category}
        </span>
        <time className="text-xs text-slate-500" dateTime={article.date}>
          {formatDate(article.date)}
        </time>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-slate-800 transition-colors group-hover:text-blue-600">
        <Link href={article.url} className="absolute inset-0" aria-label={article.title} />
        {article.title}
      </h3>

      <p className="mt-2 line-clamp-3 text-sm text-slate-600">{article.summary}</p>

      <div className="mt-4">
        <Link
          href={article.url}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label={`${article.title} を読む`}
        >
          <span>続きを読む</span>
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l5 5a.997.997 0 01.083 1.32l-.083.094-5 5a1 1 0 01-1.497-1.32l.083-.094L13.585 10H4a1 1 0 01-.117-1.993L4 8h9.585l-3.292-3.293a1 1 0 01-.083-1.32l.083-.094z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </div>
    </motion.article>
  )
}

function getBadgeClasses(color?: string) {
  // Map limited semantic colors; default to blue.
  switch (color) {
    case "emerald":
      return { bg: "bg-emerald-100", text: "text-emerald-700" }
    case "sky":
      return { bg: "bg-sky-100", text: "text-sky-700" }
    case "amber":
      return { bg: "bg-amber-100", text: "text-amber-700" }
    case "rose":
      // If "rose" was previously used as a purple stand-in, keep it distinct.
      return { bg: "bg-rose-100", text: "text-rose-700" }
    case "violet":
    case "purple":
      // Explicitly convert purple-ish to blue for this task.
      return { bg: "bg-blue-100", text: "text-blue-700" }
    default:
      return { bg: "bg-blue-100", text: "text-blue-700" }
  }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  } catch {
    return dateStr
  }
}
