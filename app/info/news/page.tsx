"use client"

import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { getAllNews } from "@/data/news"

export default function NewsIndexPage() {
  const all = getAllNews()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div
        className="w-full flex-1"
        style={{
          background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)",
        }}
      >
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="mb-6 text-2xl sm:text-3xl font-bold text-slate-800">最新情報一覧</h1>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {all.map((n) => (
              <article key={n.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[16/9] w-full overflow-hidden border-2 border-dashed border-slate-300">
                  <Image
                    src={n.imageUrl || "/placeholder.svg"}
                    alt={`${n.title} のサムネイル`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    priority={false}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="rounded bg-white/85 px-2 py-0.5 text-xs font-medium text-slate-600">
                      画像プレースホルダー
                    </span>
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{n.category}</Badge>
                    <time className="text-xs text-slate-500" dateTime={n.date}>
                      {formatDate(n.date)}
                    </time>
                  </div>
                  <h2 className="text-base font-semibold text-slate-800">
                    <Link href={n.url} className="hover:underline">
                      {n.title}
                    </Link>
                  </h2>
                  <p className="line-clamp-2 text-sm text-slate-600">{n.summary}</p>
                  <div>
                    <Link href={n.url} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      続きを読む
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <Link
              href="/info"
              className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              ← インフォメーションへ戻る
            </Link>
          </div>
        </main>
      </div>
      <Footer />
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
