import Link from "next/link"
import { fetchNewsList } from "@/lib/news"

export const dynamic = "force-static"

export default async function NewsIndexPage() {
  let items = []
  try {
    items = await fetchNewsList(50)
  } catch (e) {
    console.error(e)
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6">最新情報一覧</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white shadow p-6 text-center text-slate-500">表示できる情報がありません。</div>
      ) : (
        <div className="rounded-2xl bg-white shadow divide-y">
          {items.map((item) => (
            <div key={item.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/news/${encodeURIComponent(item.slug)}`}
                  className="text-sky-700 hover:text-sky-900 underline-offset-2 hover:underline"
                >
                  <span className="font-medium">{item.title}</span>
                </Link>
                <div className="text-xs text-slate-500 mt-1">{new Date(item.publishedAt).toLocaleString("ja-JP")}</div>
              </div>
              <Link href={`/news/${encodeURIComponent(item.slug)}`} className="text-sm text-sky-700 hover:text-sky-900">
                続きを読む
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
