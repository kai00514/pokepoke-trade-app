"use client"

import Image from "next/image"
import { Link } from "@/lib/i18n-navigation"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import type { NewsArticle } from "@/data/news"

type NewsCarouselProps = {
  articles: NewsArticle[]
  className?: string
  intervalMs?: number
}

export default function NewsCarousel({ articles, className, intervalMs = 3500 }: NewsCarouselProps) {
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!api) return
    const id = setInterval(() => {
      if (!isHovered) api.scrollNext()
    }, intervalMs)
    return () => clearInterval(id)
  }, [api, intervalMs, isHovered])

  return (
    <div
      className={cn("relative max-w-6xl mx-auto", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Carousel opts={{ align: "start", loop: true }} setApi={(c) => setApi(c)} className="w-full">
        <CarouselContent className="-ml-2 sm:-ml-3 lg:-ml-4">
          {articles.map((article) => (
            <CarouselItem
              key={article.id}
              className="
                pl-2 sm:pl-3 lg:pl-4
                basis-[88%] sm:basis-[70%] md:basis-1/2 lg:basis-[45%] xl:basis-[40%]
              "
            >
              <article className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-xl border-2 border-dashed border-slate-300">
                  <Image
                    src={article.imageUrl || "/placeholder.svg"}
                    alt={`${article.title} のサムネイル`}
                    fill
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 70vw, 40vw"
                    className="object-cover"
                    priority={true}
                  />
                  {/* Optional overlay label for clarity */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="rounded bg-white/85 px-2 py-0.5 text-xs font-medium text-slate-600">
                      画像プレースホルダー
                    </span>
                  </div>

                  {/* Bottom gradient overlay with title and meta */}
                  <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-3 sm:p-4">
                    <h3 className="line-clamp-2 text-sm sm:text-base font-semibold text-white drop-shadow">
                      <Link href={article.url} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                        {article.title}
                      </Link>
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={badgeClass(article.categoryColor)} variant="secondary">
                        {article.category}
                      </Badge>
                      <time className="text-[11px] sm:text-xs text-slate-100/90" dateTime={article.date}>
                        {formatDate(article.date)}
                      </time>
                      <Link
                        href={article.url}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`${article.title} を続きを読む`}
                      >
                        <span>続きを読む</span>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l5 5a.997.997 0 01.083 1.32l-.083.094-5 5a1 1 0 01-1.497-1.32l.083-.094L13.585 10H4a1 1 0 01-.117-1.993L4 8h9.585l-3.292-3.293a1 1 0 01-.083-1.32l.083-.094z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Clickable area for accessibility */}
                <Link href={article.url} className="absolute inset-0" aria-label={article.title} />
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="hidden sm:flex bg-white/90 hover:bg-white border-slate-200" aria-label="前へ" />
        <CarouselNext className="hidden sm:flex bg-white/90 hover:bg-white border-slate-200" aria-label="次へ" />
      </Carousel>
    </div>
  )
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

function badgeClass(color?: string) {
  switch (color) {
    case "emerald":
      return "bg-emerald-100 text-emerald-700"
    case "sky":
      return "bg-sky-100 text-sky-700"
    case "amber":
      return "bg-amber-100 text-amber-700"
    case "rose":
      return "bg-rose-100 text-rose-700"
    case "violet":
    case "purple":
      return "bg-blue-100 text-blue-700"
    default:
      return "bg-blue-100 text-blue-700"
  }
}
