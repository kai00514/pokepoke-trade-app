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

/** 非 latin-1 を含むCookie片を除外 */
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
      console.warn(`[Game8Client] ⚠️ skip non-latin1 cookie: ${k}`)
    }
  }
  return parts.join("; ")
}

/** タイムアウト付き fetch */
async function fetchWithTimeout(url: string, options: any = {}, ms = 30000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

/** 記事ページから <meta name="csrf-token"> を抽出 */
async function fetchCsrfTokenFromArticle(articleId: string, rawCookie: string): Promise<string | null> {
  if (!articleId) {
    console.warn("[Game8Client] No article ID provided for CSRF token fetch")
    return null
  }

  const url = REFERER_TMPL(articleId)
  const headers: Record<string, string> = {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    Referer: ORIGIN + "/",
    Cookie: sanitizeCookie(rawCookie),
  }

  console.log(`[Game8Client] Fetching CSRF token from: ${url}`)

  try {
    const res = await fetchWithTimeout(url, { headers }, 20000)
    if (!res.ok) {
      console.error(`[Game8Client] CSRF fetch failed: ${res.status} ${res.statusText}`)
      return null
    }

    const html = await res.text()
    const match = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i)

    if (match) {
      console.log("[Game8Client] ✅ CSRF token obtained successfully")
      return match[1]
    } else {
      console.warn("[Game8Client] ⚠️ CSRF token meta tag not found")
      return null
    }
  } catch (error) {
    console.error("[Game8Client] Error fetching CSRF token:", error)
    return null
  }
}

/** 共通ヘッダ作成 */
function buildCommonHeaders(params: {
  csrfToken?: string | null
  articleId?: string | null
  withJson?: boolean
}): Record<string, string> {
  const { csrfToken, articleId, withJson } = params
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    "User-Agent": UA,
    Origin: ORIGIN,
    Referer: articleId ? REFERER_TMPL(articleId) : ORIGIN,
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "X-Requested-With": "XMLHttpRequest",
  }

  if (csrfToken) headers["x-csrf-token"] = csrfToken
  if (withJson) headers["Content-Type"] = "application/json"

  return headers
}

/** Game8にコメント投稿 */
export async function postCommentToGame8(params: Game8PostParams, config: Game8Config): Promise<boolean> {
  const startTime = Date.now()

  console.log("[Game8Client] Starting comment post to Game8", {
    tradeId: params.tradeId,
    contentLength: params.content.length,
    friendName: params.friendName,
  })

  try {
    const cookieHeader = sanitizeCookie(config.rawCookie)

    // CSRF token取得
    const token = await fetchCsrfTokenFromArticle(config.articleId, cookieHeader)
    if (!token) {
      console.error("[Game8Client] ❌ Failed to obtain CSRF token")
      return false
    }

    // API endpoint
    const url = `${ORIGIN}/api/bbs_tool/pokepoke/trades/${params.tradeId}/comments`
    const payload = {
      comment: {
        content: params.content,
        friend_name: params.friendName,
      },
    }

    // Headers
    const headers = buildCommonHeaders({
      csrfToken: token,
      articleId: config.articleId,
      withJson: true,
    })
    headers["Authorization"] = `Bearer ${config.trainerId}`
    headers["Cookie"] = cookieHeader

    console.log("[Game8Client] Sending POST request", {
      url,
      payloadSize: JSON.stringify(payload).length,
      hasAuth: !!headers["Authorization"],
      hasCsrf: !!headers["x-csrf-token"],
    })

    // POST request
    const res = await fetchWithTimeout(url, { method: "POST", headers, body: JSON.stringify(payload) }, config.timeout)

    const duration = `${Date.now() - startTime}ms`
    const xRequestId = res.headers.get("x-request-id")

    console.log("[Game8Client] Response received", {
      status: res.status,
      statusText: res.statusText,
      duration,
      xRequestId,
    })

    if (res.status === 201) {
      try {
        const responseData = await res.json()
        console.log("[Game8Client] ✅ Comment posted successfully", {
          commentId: responseData.id,
          duration,
        })
        return true
      } catch (parseError) {
        console.warn("[Game8Client] ⚠️ 201 response but JSON parse failed")
        return true // Still consider it successful
      }
    } else {
      const responseText = await res.text()
      console.error("[Game8Client] ❌ Failed to post comment", {
        status: res.status,
        statusText: res.statusText,
        responseText: responseText.substring(0, 500),
        duration,
      })

      if (res.status === 401 || res.status === 403) {
        console.error("[Game8Client] Authentication error - Check Authorization/Cookie/CSRF token")
      } else if (res.status === 422) {
        console.error("[Game8Client] Validation error - Check payload format")
      }

      return false
    }
  } catch (error) {
    const duration = `${Date.now() - startTime}ms`
    console.error("[Game8Client] ❌ Request error", {
      error: error instanceof Error ? error.message : String(error),
      duration,
    })
    return false
  }
}
