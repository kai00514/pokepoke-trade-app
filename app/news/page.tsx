import Link from "next/link"
import { fetchNewsList } from "@/lib/news"

export const revalidate = 60

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default async function NewsIndexPage() {
  const items = await fetchNewsList(100)

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100/60 to-white">
      <div className="container mx-auto px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">最新情報一覧</h1>

        {items.length === 0 ? (
          <div className="text-slate-500">現在、表示できる最新情報はありません。</div>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-2xl bg-white shadow">
            {items.map((item) => {
              const href = item.slug ? `/news/${encodeURIComponent(item.slug)}` : `/news/${encodeURIComponent(item.id)}`
              return (
                <li key={item.id} className="px-4 py-3 sm:px-6">
                  <Link href={href} className="group flex items-center gap-3">
                    <time className="shrink-0 text-xs text-slate-500">{formatDate(item.publishedAt)}</time>
                    <span className="line-clamp-1 font-medium text-slate-900 group-hover:text-sky-700">
                      {item.title}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
