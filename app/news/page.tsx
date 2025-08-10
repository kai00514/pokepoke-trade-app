import Link from "next/link"
import { fetchNewsList } from "@/lib/news"

export const revalidate = 60

export default async function NewsIndexPage() {
  let items: Awaited<ReturnType<typeof fetchNewsList>> = []
  try {
    items = await fetchNewsList(100)
  } catch (e) {
    console.error(e)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100/60 to-white">
      <div className="container mx-auto px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">最新情報</h1>

        {!items.length ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            現在、最新情報はありません。
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-4 sm:px-6">
                <time className="shrink-0 text-xs text-slate-500">{formatDate(item.publishedAt)}</time>
                <Link href={`/news/${item.slug}`} className="text-sky-700 hover:text-sky-800 font-medium">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}
