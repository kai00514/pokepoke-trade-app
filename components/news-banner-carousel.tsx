"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import type { NewsListItem } from "@/lib/news"

type Props = {
  items?: NewsListItem[]
  className?: string
  intervalMs?: number
}

export default function NewsBannerCarousel({ items = [], className, intervalMs = 3500 }: Props) {
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!api) return
    const id = setInterval(() => {
      if (!isHovered) api.scrollNext()
    }, intervalMs)
    return () => clearInterval(id)
  }, [api, intervalMs, isHovered])

  if (!items.length) {
    return (
      <div className={cn("rounded-2xl border border-slate-200 bg-white/70 p-6 text-center text-slate-500", className)}>
        最新情報はまだありません。
      </div>
    )
  }

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Carousel opts={{ align: "start", loop: true }} setApi={(c) => setApi(c)} className="w-full">
        <CarouselContent className="-ml-2 sm:-ml-3 lg:-ml-4">
          {items.map((item) => (
            <CarouselItem
              key={item.id}
              className="
                pl-2 sm:pl-3 lg:pl-4
                basis-[85%] sm:basis-[65%] md:basis-1/2 lg:basis-[45%] xl:basis-[40%]
              "
            >
              <Link
                href={`/news/${item.slug}`}
                className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                aria-label={item.title}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
                  <div className="absolute inset-0 z-0 border-2 border-dashed border-slate-300" />
                  <Image
                    src={
                      item.bannerImage?.url || "/placeholder.svg?height=360&width=640&query=news%20banner%20placeholder"
                    }
                    alt={`${item.title} のバナー画像`}
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 1024px) 65vw, 40vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    priority={true}
                  />
                  <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/65 via-black/30 to-transparent p-4">
                    <h3 className="line-clamp-2 text-base sm:text-lg font-semibold text-white drop-shadow">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="hidden sm:flex bg-white/90 hover:bg-white border-slate-200" aria-label="前へ" />
        <CarouselNext className="hidden sm:flex bg-white/90 hover:bg-white border-slate-200" aria-label="次へ" />
      </Carousel>
    </div>
  )
}
