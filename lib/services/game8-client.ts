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
    else {
      const k = p.split("=")[0]
      console.warn(`[Game8Client] Skip non-latin1 cookie: ${k}`)
    }
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
    console.log(`[Game8Client] Fetching CSRF token from article: ${articleId}`)
    const url = REFERER_TMPL(articleId)
    const headers: Record<string, string> = {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: ORIGIN + "/",
      Cookie: sanitizeCookie(rawCookie),
    }
    const res = await fetchWithTimeout(url, { headers }, 20000)

    if (!res.ok) {
      console.error(`[Game8Client] CSRF fetch failed: ${res.status} ${res.statusText}`)
      return null
    }

    const html = await res.text()
    const m = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i)

    if (m) {
      console.log(`[Game8Client] CSRF token obtained successfully`)
      return m[1]
    } else {
      console.warn(`[Game8Client] CSRF token meta tag not found`)
      return null
    }
  } catch (error) {
    console.error(`[Game8Client] CSRF fetch error:`, error)
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
  const startTime = Date.now()
  console.log(`[Game8Client] Starting comment post to Game8`, {
    tradeId: params.tradeId,
    contentLength: params.content.length,
    friendName: params.friendName,
    trainerId: config.trainerId,
    articleId: config.articleId,
  })

  try {
    const cookieHeader = sanitizeCookie(config.rawCookie)
    console.log(`[Game8Client] Cookie sanitized, length: ${cookieHeader.length}`)

    // CSRF取得
    const token = await fetchCsrfTokenFromArticle(config.articleId, cookieHeader)
    if (!token) {
      console.error(`[Game8Client] Failed to obtain CSRF token`)
      return false
    }

    const url = `${ORIGIN}/api/bbs_tool/pokepoke/trades/${params.tradeId}/comments`
    const payload = {
      comment: {
        content: params.content,
        friend_name: params.friendName,
      },
    }

    console.log(`[Game8Client] Posting to URL: ${url}`)
    console.log(`[Game8Client] Payload:`, JSON.stringify(payload, null, 2))

    const headers = buildCommonHeaders(token, config.articleId)
    headers["Authorization"] = `Bearer ${config.trainerId}`
    headers["Cookie"] = cookieHeader

    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      },
      config.timeout,
    )

    const duration = Date.now() - startTime
    const xRequestId = res.headers.get("x-request-id")
    const contentType = res.headers.get("content-type") || ""

    console.log(`[Game8Client] Response received`, {
      status: res.status,
      statusText: res.statusText,
      duration: `${duration}ms`,
      xRequestId,
      contentType,
    })

    if (res.status === 201) {
      try {
        const responseBody = await res.text()
        if (contentType.includes("application/json")) {
          const jsonResponse = JSON.parse(responseBody)
          console.log(`[Game8Client] Success - Comment posted`, {
            commentId: jsonResponse.id,
            tradeId: params.tradeId,
            duration: `${duration}ms`,
          })
        } else {
          console.log(`[Game8Client] Success - Non-JSON response`, {
            tradeId: params.tradeId,
            duration: `${duration}ms`,
            responseBody: responseBody.substring(0, 200),
          })
        }
        return true
      } catch (parseError) {
        console.warn(`[Game8Client] Success but JSON parse failed`, {
          tradeId: params.tradeId,
          parseError: parseError,
        })
        return true
      }
    } else {
      const responseBody = await res.text()
      console.error(`[Game8Client] Failed to post comment`, {
        status: res.status,
        statusText: res.statusText,
        tradeId: params.tradeId,
        duration: `${duration}ms`,
        responseBody: responseBody.substring(0, 500),
        xRequestId,
      })

      if (res.status === 401 || res.status === 403) {
        console.error(`[Game8Client] Authentication error - Check Authorization/Cookie/CSRF token`)
      } else if (res.status === 422) {
        console.error(`[Game8Client] Validation error - Check payload format`)
      }

      return false
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Game8Client] Request error`, {
      tradeId: params.tradeId,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return false
  }
}

export function getGame8Config(): Game8Config | null {
  try {
    const enabled = process.env.GAME8_SYNC_ENABLED === "true"
    const trainerId = process.env.GAME8_TRAINER_ID
    const articleId = process.env.GAME8_ARTICLE_ID
    const rawCookie = process.env.GAME8_RAW_COOKIE

    console.log(`[Game8Client] Configuration check`, {
      enabled,
      hasTrainerId: !!trainerId,
      hasArticleId: !!articleId,
      hasCookie: !!rawCookie,
      cookieLength: rawCookie?.length || 0,
    })

    if (!enabled) {
      console.log(`[Game8Client] Game8 sync is disabled`)
      return null
    }

    if (!trainerId || !articleId || !rawCookie) {
      console.warn(`[Game8Client] Missing required configuration`, {
        hasTrainerId: !!trainerId,
        hasArticleId: !!articleId,
        hasCookie: !!rawCookie,
      })
      return null
    }

    return {
      trainerId,
      articleId,
      rawCookie,
      enabled,
      timeout: Number.parseInt(process.env.GAME8_REQUEST_TIMEOUT || "30000"),
    }
  } catch (error) {
    console.error(`[Game8Client] Configuration error:`, error)
    return null
  }
}
