// microCMS news fetchers that align with the provided response shape.

type MicroCMSImage = {
  url: string
  width?: number
  height?: number
}

type RawNews = {
  id: string
  title?: string | null
  slug?: string | null
  content?: string | null // HTML body
  bannerImage?: MicroCMSImage | null
  publishedAt?: string | null
  createdAt?: string | null
}

export type NewsListItem = {
  id: string
  title: string
  slug: string | null
  content: string // raw HTML
  bannerImage?: MicroCMSImage | null
  publishedAt: string
}

export type NewsDetail = NewsListItem

function getConfig() {
  const domain = process.env.MICROCMS_SERVICE_DOMAIN
  const key = process.env.MICROCMS_API_KEY
  if (!domain || !key) return null
  return { domain, key }
}

function baseUrl(path: string, cfg: { domain: string }) {
  return `https://${cfg.domain}.microcms.io/api/v1${path}`
}

function headers(cfg: { key: string }) {
  return { "X-MICROCMS-API-KEY": cfg.key }
}

function normalize(raw: RawNews): NewsListItem {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    slug: raw.slug ? String(raw.slug) : null,
    content: String(raw.content ?? ""),
    bannerImage: raw.bannerImage ?? null,
    publishedAt: String(raw.publishedAt ?? raw.createdAt ?? ""),
  }
}

/**
 * Fetch latest news list (ordered by publishedAt desc).
 * Includes content so we can extract first <img> as a thumbnail fallback.
 */
export async function fetchNewsList(limit = 20): Promise<NewsListItem[]> {
  const cfg = getConfig()
  if (!cfg) {
    console.warn("[news] microCMS is not configured. Set MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY.")
    return []
  }

  const url = new URL(baseUrl("/news", cfg))
  url.searchParams.set("orders", "-publishedAt")
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("fields", "id,title,slug,content,bannerImage,publishedAt")

  const res = await fetch(url.toString(), {
    headers: headers({ key: cfg.key }),
    next: { tags: ["news"], revalidate: 60 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch news list: ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as { contents?: RawNews[] }
  const contents = data.contents ?? []
  return contents.map(normalize)
}

/**
 * Fetch one news by id or slug.
 * - Tries GET /news/{idOrSlug} first (works when it's an id).
 * - If 404, falls back to GET /news?filters=slug[equals]{idOrSlug}.
 */
export async function fetchNewsByIdOrSlug(idOrSlug: string): Promise<NewsDetail | null> {
  const cfg = getConfig()
  if (!cfg) {
    console.warn("[news] microCMS is not configured. Set MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY.")
    return null
  }

  // Try direct by ID
  const directUrl =
    baseUrl(`/news/${encodeURIComponent(idOrSlug)}`, cfg) + "?fields=id,title,slug,content,bannerImage,publishedAt"

  let res = await fetch(directUrl, {
    headers: headers({ key: cfg.key }),
    next: { tags: ["news", `news:${idOrSlug}`], revalidate: 60 },
  })

  if (res.ok) {
    const raw = (await res.json()) as RawNews
    return normalize(raw)
  }

  // If not found by ID, try by slug
  if (res.status !== 404) {
    throw new Error(`Failed to fetch news (by id): ${res.status} ${res.statusText}`)
  }

  const listUrl = new URL(baseUrl("/news", cfg))
  listUrl.searchParams.set("filters", `slug[equals]${idOrSlug}`)
  listUrl.searchParams.set("limit", "1")
  listUrl.searchParams.set("fields", "id,title,slug,content,bannerImage,publishedAt")

  res = await fetch(listUrl.toString(), {
    headers: headers({ key: cfg.key }),
    next: { tags: ["news", `news:${idOrSlug}`], revalidate: 60 },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch news (by slug): ${res.status} ${res.statusText}`)
  }

  const data = (await res.json()) as { contents?: RawNews[] }
  const item = (data.contents ?? [])[0]
  return item ? normalize(item) : null
}
