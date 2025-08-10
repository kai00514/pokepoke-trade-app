import Image from "next/image"
import { notFound } from "next/navigation"
import { fetchNewsBySlug } from "@/lib/news"
import { sanitizeNewsHtml } from "@/lib/sanitize"

type Props = { params: { slug: string } }

export default async function NewsDetailPage({ params }: Props) {
  const data = await fetchNewsBySlug(params.slug)
  if (!data) return notFound()

  const html = sanitizeNewsHtml(data.body)

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <article className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{data.title}</h1>
          <div className="text-xs text-slate-500 mt-2">{new Date(data.publishedAt).toLocaleString("ja-JP")}</div>
        </header>

        {data.bannerImage?.url ? (
          <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden shadow mb-6">
            <Image
              src={data.bannerImage.url || "/placeholder.svg"}
              alt={data.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority={false}
            />
          </div>
        ) : (
          <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden shadow mb-6">
            <Image
              src="/placeholder.svg?height=320&width=768"
              alt="News banner placeholder"
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority={false}
            />
          </div>
        )}

        <div
          className="prose prose-slate max-w-none prose-img:rounded-lg prose-a:text-sky-700 hover:prose-a:text-sky-900"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  )
}
