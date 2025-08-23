const ORIGIN = "https://game8.jp"
const REFERER_TMPL = (articleId: string) => `${ORIGIN}/pokemon-tcg-pocket/${articleId}`
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"

interface Game8Config {
  trainerId: string
  articleId: string
  rawCookie: string
  enabled: boolean
  timeout: number
}

interface Game8PostParams {
  tradeId: string
  content: string
  friendName: string
}

function sanitizeCookie(rawCookie?: string): string {
  const parts: string[] = []
  for (const p0 of String(rawCookie || "")
    .trim()
    .split(";")) {
    const p = p0.trim()
    if (!p) continue
    let ok = true
    for (let i = 0; i < p.length; i++) {
      if (p.charCodeAt(i) > 255) {
        ok = false
        break
      }
    }
    if (ok) parts.push(p)
  }
  return parts.join("; ")
}

async function fetchWithTimeout(url: string, options: any = {}, ms = 30000): Promise<any> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

async function fetchCsrfTokenFromArticle(articleId: string, rawCookie: string): Promise<string | null> {
  try {
    const url = REFERER_TMPL(articleId)
    const headers: Record<string, string> = {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: ORIGIN + "/",
      Cookie: sanitizeCookie(rawCookie),
    }
    const res = await fetchWithTimeout(url, { headers }, 20000)
    if (!res.ok) return null

    const html = await res.text()
    const m = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i)
    return m ? m[1] : null
  } catch {
    return null
  }
}

function buildCommonHeaders(csrfToken: string | null, articleId: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    "User-Agent": UA,
    Origin: ORIGIN,
    Referer: REFERER_TMPL(articleId),
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  }
  if (csrfToken) headers["x-csrf-token"] = csrfToken
  return headers
}

export async function postCommentToGame8(params: Game8PostParams, config: Game8Config): Promise<boolean> {
  try {
    const cookieHeader = sanitizeCookie(config.rawCookie)

    // CSRF取得
    const token = await fetchCsrfTokenFromArticle(config.articleId, cookieHeader)

    const url = `${ORIGIN}/api/bbs_tool/pokepoke/trades/${params.tradeId}/comments`
    const payload = {
      comment: {
        content: params.content,
        friend_name: params.friendName,
      },
    }

    const headers = buildCommonHeaders(token, config.articleId)
    headers["Authorization"] = `Bearer ${config.trainerId}`
    headers["Cookie"] = cookieHeader

    const res = await fetchWithTimeout(url, { method: "POST", headers, body: JSON.stringify(payload) }, config.timeout)

    return res.status === 201
  } catch (error) {
    console.error("[Game8Client] Error:", error)
    return false
  }
}

export function getGame8Config(): Game8Config | null {
  try {
    const enabled = process.env.GAME8_SYNC_ENABLED === "true"
    const trainerId = process.env.GAME8_TRAINER_ID
    const articleId = process.env.GAME8_ARTICLE_ID
    const rawCookie = process.env.GAME8_RAW_COOKIE

    if (!enabled || !trainerId || !articleId || !rawCookie) {
      return null
    }

    return {
      trainerId,
      articleId,
      rawCookie,
      enabled,
      timeout: Number.parseInt(process.env.GAME8_REQUEST_TIMEOUT || "30000"),
    }
  } catch {
    return null
  }
}
