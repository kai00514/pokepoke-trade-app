import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchNewsBySlug } from "@/lib/news"
import { sanitizeCmsHtml } from "@/lib/sanitize"

export const revalidate = 60

type Props = { params: { slug: string } }

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = params

  let article = null
  try {
    article = await fetchNewsBySlug(slug)
  } catch (e) {
    console.error(e)
  }

  if (!article) {
    notFound()
  }

  const safeHtml = sanitizeCmsHtml(article!.body)

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100/60 to-white">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/news" className="text-sm text-sky-700 hover:text-sky-800">
              ← 最新情報一覧に戻る
            </Link>
            <time className="ml-auto text-xs text-slate-500">{formatDate(article!.publishedAt)}</time>
          </div>

          <h1 className="mb-4 text-2xl font-bold text-slate-900">{article!.title}</h1>

          {article!.bannerImage?.url ? (
            <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src={article!.bannerImage.url || "/placeholder.svg"}
                alt={`${article!.title} のバナー画像`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          ) : null}

          <article className="prose prose-slate max-w-none prose-img:rounded-lg prose-a:text-sky-700 hover:prose-a:text-sky-800">
            <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
          </article>
        </div>
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
