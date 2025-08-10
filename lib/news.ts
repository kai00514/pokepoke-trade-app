type MicroCMSImage = {
  url: string
  width?: number
  height?: number
}

export type NewsListItem = {
  id: string
  title: string
  slug: string
  publishedAt: string
  bannerImage?: MicroCMSImage | null
}

export type NewsDetail = NewsListItem & {
  body: string
}

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN
const API_KEY = process.env.MICROCMS_API_KEY

function baseUrl(path: string) {
  if (!SERVICE_DOMAIN) throw new Error("MICROCMS_SERVICE_DOMAIN is not set")
  return `https://${SERVICE_DOMAIN}.microcms.io/api/v1${path}`
}

function headers() {
  if (!API_KEY) throw new Error("MICROCMS_API_KEY is not set")
  return {
    "X-MICROCMS-API-KEY": API_KEY,
  }
}

/**
 * Fetch latest news list (ordered by publishedAt desc)
 */
export async function fetchNewsList(limit = 20): Promise<NewsListItem[]> {
  const url = new URL(baseUrl("/news"))
  url.searchParams.set("orders", "-publishedAt")
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("fields", ["id", "title", "slug", "publishedAt", "bannerImage"].join(","))

  const res = await fetch(url.toString(), {
    headers: headers(),
    // ISR and tag-based revalidation
    next: { revalidate: 60, tags: ["news"] },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch news list: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const contents: any[] = data.contents ?? []
  return contents.map((c) => ({
    id: String(c.id),
    title: String(c.title ?? ""),
    slug: String(c.slug ?? ""),
    publishedAt: String(c.publishedAt ?? c.createdAt ?? ""),
    bannerImage: c.bannerImage ?? null,
  }))
}

/**
 * Fetch one news by slug
 */
export async function fetchNewsBySlug(slug: string): Promise<NewsDetail | null> {
  const url = new URL(baseUrl("/news"))
  url.searchParams.set("filters", `slug[equals]${slug}`)
  url.searchParams.set("limit", "1")
  url.searchParams.set("fields", ["id", "title", "slug", "publishedAt", "bannerImage", "body"].join(","))

  const res = await fetch(url.toString(), {
    headers: headers(),
    next: { revalidate: 60, tags: ["news", `news:${slug}`] },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch news by slug: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const item = (data.contents ?? [])[0]
  if (!item) return null

  return {
    id: String(item.id),
    title: String(item.title ?? ""),
    slug: String(item.slug ?? ""),
    publishedAt: String(item.publishedAt ?? item.createdAt ?? ""),
    bannerImage: item.bannerImage ?? null,
    body: String(item.body ?? ""),
  }
}
