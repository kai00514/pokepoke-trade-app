// lib/server/game8Client.ts
// Node 18+ / TypeScript / ESM（依存なし）
// ※ クライアントに配布しないこと。server-only な場所に置いてください。

/** ====== 環境変数 ====== */
const ENV = {
  RAW_COOKIE: process.env.GAME8_RAW_COOKIE ?? "",
  TRAINER_ID: process.env.GAME8_TRAINER_ID ?? "",
  ARTICLE_ID: process.env.GAME8_ARTICLE_ID ?? null,
  TIMEOUT_MS: parseInt(process.env.GAME8_REQUEST_TIMEOUT || "30000", 10),
  SYNC_ENABLED: /^(1|true|yes|on)$/i.test(process.env.GAME8_SYNC_ENABLED ?? ""),
};

/** ====== 定数 ====== */
const ORIGIN = "https://game8.jp";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

/** ====== 公開型 ====== */
export type Game8PostResult = {
  ok: boolean;
  status: number;
  xRequestId?: string | null;
  data?: any;      // JSONの場合
  text?: string;   // テキストの場合
  error?: string;  // 失敗時の説明
};

/** ====== 内部ユーティリティ ====== */
function requireEnv(name: string, val?: string | null) {
  if (!val || !String(val).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(val);
}

/** 非 latin-1 を含むCookie片を除外（Python版 sanitize_cookie 相当） */
function sanitizeCookie(rawCookie?: string): string {
  const parts: string[] = [];
  for (const p0 of String(rawCookie || "").trim().split(";")) {
    const p = p0.trim();
    if (!p) continue;
    let ok = true;
    for (let i = 0; i < p.length; i++) {
      if (p.charCodeAt(i) > 255) {
        ok = false;
        break;
      }
    }
    if (ok) parts.push(p);
    else {
      const k = p.split("=")[0];
      console.warn(`⚠️ [game8] skip non-latin1 cookie: ${k}`);
    }
  }
  return parts.join("; ");
}

/** タイムアウト付き fetch */
async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = 30_000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/** 記事ページから <meta name="csrf-token"> を抽出（同一Cookieで取得） */
async function fetchCsrfTokenFromArticle(articleId: string, cookie: string, timeoutMs: number): Promise<string | null> {
  const url = `${ORIGIN}/pokemon-tcg-pocket/${articleId}`;
  const headers: Record<string, string> = {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    Referer: ORIGIN + "/",
    Cookie: sanitizeCookie(cookie),
  };
  const res = await fetchWithTimeout(url, { headers }, timeoutMs);
  if (!res.ok) {
    console.warn(`[game8] CSRF GET failed: ${res.status}`);
    return null;
  }
  const html = await res.text();
  const m = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i);
  if (m) return m[1];
  console.warn("[game8] csrf-token meta not found.");
  return null;
}

/** ヘッダ生成 */
function buildHeaders(csrfToken: string | null, articleId: string | null, withJson = false): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    "User-Agent": UA,
    Origin: ORIGIN,
    Referer: articleId ? `${ORIGIN}/pokemon-tcg-pocket/${articleId}` : ORIGIN,
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "X-Requested-With": "XMLHttpRequest",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken; // 大小無視
  if (withJson) headers["Content-Type"] = "application/json";
  return headers;
}

/** ====== 公開API ====== */

/**
 * Game8 にコメントを投稿
 * @param tradeId - トレードUUID
 * @param content - コメント本文
 * @param friendName - 表示名（省略時は "ゲスト"）
 * @param opts - 上書きオプション（任意）
 */
export async function postCommentGame8(
  tradeId: string,
  content: string,
  friendName?: string,
  opts?: {
    /** 既知のCSRF（指定がなければ articleId から自動取得） */
    csrfToken?: string | null;
    /** 既定を上書きしたい場合のみ指定 */
    cookie?: string;
    trainerId?: string | number;
    articleId?: string | null;
    timeoutMs?: number;
  }
): Promise<Game8PostResult> {
  try {
    // 必須の環境変数チェック
    const cookie = sanitizeCookie(opts?.cookie ?? requireEnv("GAME8_RAW_COOKIE", ENV.RAW_COOKIE));
    const trainerId = String(opts?.trainerId ?? requireEnv("GAME8_TRAINER_ID", ENV.TRAINER_ID));
    const articleId = (opts?.articleId ?? ENV.ARTICLE_ID) || null;
    const timeoutMs = opts?.timeoutMs ?? ENV.TIMEOUT_MS;

    // CSRF 決定
    let csrfToken = typeof opts?.csrfToken !== "undefined" ? opts?.csrfToken : null;
    if (!csrfToken && articleId) {
      csrfToken = await fetchCsrfTokenFromArticle(articleId, cookie, timeoutMs);
    }

    // POST
    const url = `${ORIGIN}/api/bbs_tool/pokepoke/trades/${tradeId}/comments`;
    const payload = { comment: { content, friend_name: friendName || "ゲスト" } };
    const headers = buildHeaders(csrfToken, articleId, true);
    headers["Authorization"] = `Bearer ${trainerId}`;
    headers["Cookie"] = cookie;

    const res = await fetchWithTimeout(url, { method: "POST", headers, body: JSON.stringify(payload) }, timeoutMs);

    const xRequestId = res.headers.get("x-request-id");
    const ctype = res.headers.get("content-type") || "";
    const bodyText = await res.text();

    if (res.ok && ctype.includes("application/json")) {
      try {
        const data = JSON.parse(bodyText);
        return { ok: true, status: res.status, data, xRequestId };
      } catch {
        // JSONでなかった
        return { ok: res.ok, status: res.status, text: bodyText, xRequestId };
      }
    }
    return {
      ok: res.ok,
      status: res.status,
      text: bodyText,
      xRequestId,
      error: !res.ok ? `HTTP ${res.status}` : undefined,
    };
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || String(e) };
  }
}

/**
 * fire-and-forget で投稿を発火（API応答を待たせたくない時に）
 * 失敗は console にだけ記録します。
 */
export function kickPostCommentGame8(tradeId: string, content: string, friendName?: string) {
  // 環境変数 GAME8_SYNC_ENABLED が truthy なら “同期” で使いたい意図とみなして何もしない
  if (ENV.SYNC_ENABLED) return;
  (async () => {
    try {
      const r = await postCommentGame8(tradeId, content, friendName);
      if (!r.ok) {
        console.error("[game8] post failed:", r.status, r.error, r.text?.slice(0, 500));
      } else {
        console.log("[game8] posted:", r.status, r.data?.id || r.text?.slice(0, 80));
      }
    } catch (e) {
      console.error("[game8] post threw:", e);
    }
  })();
}
