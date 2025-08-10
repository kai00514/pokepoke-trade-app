import Image from "next/image"
import { notFound } from "next/navigation"
import sanitizeHtml from "sanitize-html"
import { fetchNewsByIdOrSlug } from "@/lib/news"

export const revalidate = 60

type Props = { params: { slug: string } }

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function extractFirstImageSrc(html: string | undefined): string | null {
  if (!html) return null
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] ?? null
}

export default async function NewsDetailPage({ params }: Props) {
  const data = await fetchNewsByIdOrSlug(params.slug)
  if (!data) return notFound()

  // Sanitize HTML; allow img, a, iframe and relevant attributes.
  const sanitized = sanitizeHtml(data.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "iframe"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "class", "style", "loading"],
      a: ["href", "name", "target", "rel", "title", "class"],
      iframe: ["src", "title", "allow", "allowfullscreen", "frameborder", "width", "height", "class", "style"],
    },
    // Optionally restrict iframe hostnames (uncomment to limit):
    // allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com"],
    transformTags: {
      // Ensure external links open safely
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  })

  // Wrap iframes in a responsive container (16:9)
  const responsiveHtml = sanitized.replace(
    /<iframe\b([^>]*)>(.*?)<\/iframe>/gis,
    (_m, attrs) => `<div class="aspect-video"><iframe ${attrs}></iframe></div>`,
  )

  const heroSrc = data.bannerImage?.url || extractFirstImageSrc(data.content) || "/placeholder.svg?height=400&width=800"

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100/60 to-white">
      <div className="container mx-auto px-4 py-10">
        <article className="mx-auto max-w-3xl">
          <header className="mb-6">
            <div className="text-xs text-slate-500">{formatDate(data.publishedAt)}</div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{data.title}</h1>
          </header>

          {heroSrc ? (
            <div className="relative w-full h-48 sm:h-64 md:h-80 rounded-2xl overflow-hidden shadow mb-6">
              <Image
                src={heroSrc || "/placeholder.svg"}
                alt={data.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority={false}
              />
            </div>
          ) : null}

          <div
            className="prose prose-slate max-w-none prose-img:rounded-lg prose-a:text-sky-700 hover:prose-a:text-sky-900"
            dangerouslySetInnerHTML={{ __html: responsiveHtml }}
          />
        </article>
      </div>
    </main>
  )
}
