"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import type { NewsListItem } from "@/lib/news"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

type Props = {
  items: NewsListItem[]
  className?: string
}

// Extract the first <img src="..."> from raw HTML to use as a thumbnail fallback.
function extractFirstImageSrc(html: string | undefined): string | null {
  if (!html) return null
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] ?? null
}

export default function NewsBannerCarousel({ items, className }: Props) {
  const plugin = React.useRef(
    Autoplay({
      delay: 3500,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
    }),
  )

  if (!items?.length) {
    return <div className={cn("text-center text-slate-500 py-10", className)}>現在表示できる最新情報はありません。</div>
  }

  return (
    <Carousel opts={{ align: "start", loop: true }} plugins={[plugin.current]} className={cn("relative", className)}>
      <CarouselContent className="-ml-2 sm:-ml-3">
        {items.map((item) => {
          const fallbackFromHtml = extractFirstImageSrc(item.content)
          const imgUrl = item.bannerImage?.url || fallbackFromHtml || "/placeholder.svg?height=360&width=640"
          const href = item.slug ? `/news/${encodeURIComponent(item.slug)}` : `/news/${encodeURIComponent(item.id)}`
          return (
            <CarouselItem
              key={item.id}
              className="pl-2 sm:pl-3 basis-[85%] sm:basis-[60%] md:basis-[50%] lg:basis-[40%]"
            >
              <Link
                href={href}
                className="group block rounded-2xl overflow-hidden bg-slate-50 shadow hover:shadow-md transition-shadow"
                aria-label={item.title}
              >
                <div className="relative h-40 sm:h-48 md:h-56">
                  <Image
                    src={imgUrl || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 60vw, 40vw"
                    className="object-cover"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <h3 className="line-clamp-2 text-base sm:text-lg font-semibold text-white drop-shadow">
                      {item.title}
                    </h3>
                  </div>
                  {!item.bannerImage?.url ? (
                    <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none" />
                  ) : null}
                </div>
              </Link>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  )
}
