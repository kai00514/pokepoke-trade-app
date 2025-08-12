import Link from "next/link"
import Image from "next/image"
import Header from "@/components/layout/header"
import Footer from "@/components/footer"
import { getInfoList } from "@/lib/actions/info-articles"

export const revalidate = 60

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

export default async function InfoNewsPage() {
  const list = await getInfoList(24, 0)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1" style={{ background: "linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 55%, #FFFFFF 100%)" }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <header className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">最新情報一覧</h1>
          </header>

          {list.length === 0 ? (
            <div className="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-slate-600">
              表示できる最新情報がありません。
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {list.map((a) => (
                <Link
                  key={a.id}
                  href={`/info/${a.id}`}
                  className="group overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  prefetch={false}
                >
                  <div className="relative w-full aspect-[16/9] bg-slate-100">
                    <Image
                      src={
                        (a.thumbnail_image_url && a.thumbnail_image_url.startsWith("http")
                          ? a.thumbnail_image_url
                          : "/placeholder.svg?height=180&width=320&query=news-grid-card") as string
                      }
                      alt={a.title ?? "最新情報"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      {a.category ? (
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {a.category}
                        </span>
                      ) : null}
                      {Array.isArray(a.tags) && a.tags[0] ? (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {a.tags[0]}
                        </span>
                      ) : null}
                      <span className="text-xs text-slate-600 ml-auto">{formatDate(a.published_at)}</span>
                    </div>
                    <h2 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">{a.title}</h2>
                    {a.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-slate-600">{a.excerpt}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Link href="/info" className="text-sm text-blue-700 hover:underline">
              ダッシュボードへ戻る
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
