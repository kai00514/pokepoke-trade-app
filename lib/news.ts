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
  return {
    "X-MICROCMS-API-KEY": cfg.key,
  }
}

export function isMicroCMSConfigured(): boolean {
  return !!getConfig()
}

/**
 * Fetch latest news list (ordered by publishedAt desc)
 * Returns [] if microCMS env is not configured.
 */
export async function fetchNewsList(limit = 20): Promise<NewsListItem[]> {
  const cfg = getConfig()
  if (!cfg) {
    console.warn(
      "[news] microCMS is not configured. Set MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY to enable news fetching.",
    )
    return []
  }

  const url = new URL(baseUrl("/news", cfg))
  url.searchParams.set("orders", "-publishedAt")
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("fields", ["id", "title", "slug", "publishedAt", "bannerImage"].join(","))

  const res = await fetch(url.toString(), {
    headers: headers({ key: cfg.key }),
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
 * Returns null if microCMS env is not configured or not found.
 */
export async function fetchNewsBySlug(slug: string): Promise<NewsDetail | null> {
  const cfg = getConfig()
  if (!cfg) {
    console.warn(
      "[news] microCMS is not configured. Set MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY to enable news fetching.",
    )
    return null
  }

  const url = new URL(baseUrl("/news", cfg))
  url.searchParams.set("filters", `slug[equals]${slug}`)
  url.searchParams.set("limit", "1")
  url.searchParams.set("fields", ["id", "title", "slug", "publishedAt", "bannerImage", "body"].join(","))

  const res = await fetch(url.toString(), {
    headers: headers({ key: cfg.key }),
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
