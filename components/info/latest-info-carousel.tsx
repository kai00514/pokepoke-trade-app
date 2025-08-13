"use client"

import Link from "next/link"
import Image from "next/image"
import type { InfoArticle } from "@/lib/actions/info-articles"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

function formatDate(dateStr?: string | null) {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}.${mm}.${dd}`
  } catch {
    return ""
  }
}

function NewsCard({ a }: { a: InfoArticle }) {
  const href = `/info/${a.id}`
  const date = formatDate(a.published_at || undefined)
  const badge = (Array.isArray(a.tags) && a.tags[0]) || a.category || ""

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="relative w-full aspect-[16/9] bg-slate-100">
        <Image
          src={
            (a.thumbnail_image_url && a.thumbnail_image_url.startsWith("http")
              ? a.thumbnail_image_url
              : "/placeholder.svg?height=180&width=320&query=latest-info-card") as string
          }
          alt={a.title ?? "最新情報"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <div className="flex items-center gap-2">
            {badge ? (
              <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {badge}
              </span>
            ) : null}
            {date ? <span className="text-xs text-white/90">{date}</span> : null}
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{a.title}</h3>
        {a.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-slate-600">{a.excerpt}</p> : null}
      </div>
    </Link>
  )
}

interface LatestInfoCarouselProps {
  items: InfoArticle[]
}

export function LatestInfoCarousel({ items }: LatestInfoCarouselProps) {
  return (
    <Carousel opts={{ align: "start" }} className="w-full">
      <CarouselContent className="-ml-3">
        {items.map((a) => (
          <CarouselItem key={a.id} className="pl-3 basis-[86%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
            <NewsCard a={a} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="hidden sm:flex">
        <CarouselPrevious />
        <CarouselNext />
      </div>
    </Carousel>
  )
}
