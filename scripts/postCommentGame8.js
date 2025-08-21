#!/usr/bin/env node

/**
 * Game8 pokepoke コメント投稿クライアント（Node.js ESM 単一ファイル版）
 * Node 18+ 必須（グローバル fetch 利用）
 *
 * 使い方:
 *  node postCommentGame8.js \
 *    --trade-id b3124dd0-63cf-4d91-91fd-0f0087528798 \
 *    --content "よろしくお願いします！" \
 *    --friend-name "Kai" \
 *    --trainer-id 495490 \
 *    --article-id 666311
 *
 * ※ --raw-cookie を渡さなければ、下の RAW_COOKIE が使われます。
 */

import { fileURLToPath } from "url"
import path from "path"

const ORIGIN = "https://game8.jp"
const REFERER_TMPL = (articleId) => `${ORIGIN}/pokemon-tcg-pocket/${articleId}`
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"

/** ←←← ここに DevTools の Cookie ヘッダー全文を貼り付け（; 区切りでOK、改行可） */
const RAW_COOKIE =
  process.env.GAME8_RAW_COOKIE ||
  `
gtuid=bd69ae13-0bf3-401b-9fe8-e20c7c3cf088; switch_advertisement=2; _ss_pp_id=dbd93d70dbbfe908e691668144055523; _id5_uid=ID5-ZHMOvLtukSlEhx1b5F2l4Op5-jFVuHY_jBkqsdRoEg; __td_signed=true; _im_id.1012292=dd5336f5b110fee7.1732372682.; _im_vid=01JDCQAN1S2SNXACFN42MCMXRP; ignore_user_ids=; _im_vid=01JDCQAN1S2SNXACFN42MCMXRP; adr_id=YxiX1QMImxvstAGdX4d2PITMmesdsKGi5sjuWAY7ZFQlVDfl; __gsas=ID=1b62bb9edc4fb273:T=1736673618:RT=1736673618:S=ALNI_MZCulg_VNABsogUlSCFgTXUiOHSQg; _td=9ffd9c99-5e51-4c42-be5e-9d77b4d9969b; __flux_u=9dbf555b6d074009bbf332443c230bda; _flux_dataharbor=1; __flux_ls=0|0; _gcl_au=1.1.685866897.1746948745; _unv_aid=7b1854bb-86c4-43fd-afc1-914fed4e3870; _cc_id=3316674b0070f93007e2520acf4cdb5f; sharedid=e50302a3-79bd-444d-ba49-86aeecb41068; sharedid_cst=zix7LPQsHA%3D%3D; _sharedID=0974af65-77f8-404e-a979-cc472808b118; _sharedID_cst=zix7LPQsHA%3D%3D; pubmaticId=%7B%22id%22%3A%22608CC6E5-2DCC-4AA4-ADB7-3E661AF6F6BA%22%7D; pubmaticId_cst=zix7LPQsHA%3D%3D; __qca=P1-082540f0-54bf-43f5-80d1-b5443ef3cca5; uuid=6199A366-32CC-40C7-A71F-C94D3D10F86D; jiyakeji_uuid=3249e410-5732-11f0-aea6-a7c627d7be26; pubmaticId_last=Sun%2C%2006%20Jul%202025%2005%3A16%3A21%20GMT; _session_id=9d79c5c5e5c465ff77f5c2bfd6bce883; _g8anonymouslogin=e3d2bea1-1fa3-49fa-addf-a8bc95a655bf; _yjsu_yjad=1752895495.18d5a0eb-3e9c-43fd-9acf-1aaa59bf9225; panoramaId_expiry=1753503041408; panoramaId=25cec63499ba003d7b7ee13f31ef16d53938e948b0e2f3fb8f6e5f689dcd8c60; panoramaIdType=panoIndiv; _im_uid.3929=i.jAkI-99XTGuRxEFxG0MaRg; segment_id=; _gid=GA1.2.1355819907.1753014126; __bnc_pfpuid__=135a-cpNUrUpRk0; gtsid=0f04e214-0d3a-496d-ae2a-55c48c62cb0d; _unv_id=01JTXGZE6MTRFAS8JJEFMSFPS9; _im_ses.1012292=1; __gads=ID=f0df8438700508bc:T=1732372681:RT=1753031960:S=ALNI_MbkV7DPjKr8DBDWRjWx0_CzkeUdCQ; __gpi=UID=00000f754bff6803:T=1732372681:RT=1753031960:S=ALNI_MZ2inUASOHDQUbXey2TZMx7JmDvzA; __eoi=ID=4d77b79290c79e4b:T=1749282692:RT=1753031960:S=AA-AfjYNeLVPWPNjPApnRXlb-F8V; _ga=GA1.1.1385027198.1732372681; __AP_SESSION__=22bb6fe4-3864-4e09-a34a-1ca60869b31b; FCNEC=%5B%5B%22AKsRol8FYUAxkvTSa30vqkbzIw7r2EqwX5dUvH15kco82_7GU62GL20jWfrbMsKAbg4kOhrZUa6ajfe5-_7Kh2ZVWV9FIQRKGRIkHWE6nhI9RRBbH-YCm3QDJdA6Uym_fOiRvHCG2-skUUH8S1eeLxRIzCQ74GrZNw%3D%3D%22%5D%2Cnull%2C%5B%5B2%2C%22%5Bnull%2C%5Bnull%2C1%2C%5B1735015969%2C356626000%5D%5D%5D%22%5D%5D%5D; cto_bidid=Vx_cBV9hMUVtT2puVTJkJTJGMUpTUE9jblVHeTVvJTJGT3pzd2R0YlFWdnNkdFI3dGpWYjl0MXJjblNpVEd3RFRmZDZ1bW5VJTJCZUMlMkI5VG4wMVhMZXY1ZkNUQlVWemZOWUxLU2pqTktvYjRGUHRGbWw4NXhrJTNE; cto_bundle=jQyTMF9ZWEFZeUF6dHpnSlEySDkySmUzc0xmbEd0ZTFRb2dFWDZRQVFtSjJROUhwTzRsSk5uWTIySVNQanllNExsRHI2Qzd5U1BuSm1EdCUyRnp0TGJNcGxCcE1pRjhkRUFvYlRyZ1dIUWI3Q29rTmpvUnQzZk1LckF3Y3AwSDhSaUQzcGclMkI5Q3dacEFMWVozJTJGMGtJS0NQdzUlMkZ4aVNoMjNYUGpQSFQzUTczNDdqcllZbCUyQkRPR01NM1hxYXVZWDhSZDVVQTNxOTZNNEhRRkF5OHVtVFpVcmhFTkNxUSUzRCUzRA; _ga_X6BXM3FJY5=GS2.1.s1753031519$o55$g1$t1753032072$j60$l0$h0; _ga_512NHKGQGG=GS2.1.s1753031519$o55$g1$t1753032072$j60$l0$h0; _dd_s=rum=0&expire=1753032973612; browsing_history=%5B%7B%22archive_id%22%3A666311%2C%22date%22%3A1753032073%7D%2C%7B%22archive_id%22%3A698983%2C%22date%22%3A1753025074%7D%2C%7B%22archive_id%22%3A639698%2C%22date%22%3A1753017661%7D%2C%7B%22archive_id%22%3A700680%2C%22date%22%3A1752898220%7D%2C%7B%22archive_id%22%3A686020%2C%22date%22%3A1752585798%7D%2C%7B%22archive_id%22%3A648005%2C%22date%22%3A1752403578%7D%2C%7B%22archive_id%22%3A651108%2C%22date%22%3A1751778980%7D%5D; __flux_s=1753031521945|1753031521945|682446b1ecf1479f8cfd270379fa90dd|4
`

/** 非 latin-1 を含むCookie片を除外（Python版 sanitize_cookie 相当） */
function sanitizeCookie(rawCookie) {
  const parts = []
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
      console.warn(`⚠️ skip non-latin1 cookie: ${k}`)
    }
  }
  return parts.join("; ")
}

/** タイムアウト付き fetch */
async function fetchWithTimeout(url, options = {}, ms = 30000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

/** 記事ページから <meta name="csrf-token"> を抽出（同一Cookieで取得） */
async function fetchCsrfTokenFromArticle({ articleId, rawCookie }) {
  if (!articleId) return null
  const url = REFERER_TMPL(articleId)
  const headers = {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    Referer: ORIGIN + "/",
    Cookie: sanitizeCookie(rawCookie || ""),
  }
  const res = await fetchWithTimeout(url, { headers }, 20000)
  if (!res.ok) {
    console.warn(`[WARN] CSRF取得GET失敗: ${res.status}`)
    return null
  }
  const html = await res.text()
  const m = html.match(/<meta\s+name=["']csrf-token["']\s+content=["']([^"']+)["']/i)
  if (m) return m[1]
  console.warn("[WARN] csrf-token メタタグが見つかりませんでした。")
  return null
}

/** サイト傾向に合わせた共通ヘッダ作成 */
function buildCommonHeaders({ csrfToken, articleId, withJson = false }) {
  const headers = {
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
  if (csrfToken) headers["x-csrf-token"] = csrfToken // 大小無視
  if (withJson) headers["Content-Type"] = "application/json"
  return headers
}

/**
 * コメント投稿本体
 * @param {Object} params
 * @param {string} params.tradeId - トレードUUID
 * @param {string} params.content - コメント本文
 * @param {string} params.friendName - フレンド名表示
 * @param {number|string} params.trainerId - Authorization: Bearer に入れる数値ID
 * @param {string} [params.rawCookie] - Cookieヘッダー文字列（省略時は RAW_COOKIE）
 * @param {string|null} [params.csrfToken] - 既知のCSRFトークン（省略可）
 * @param {string|null} [params.articleId] - CSRF自動取得/Referer用（例: "666311"）
 * @returns {Promise<Response>}
 */
export async function postComment({
  tradeId,
  content,
  friendName,
  trainerId,
  rawCookie = RAW_COOKIE,
  csrfToken = null,
  articleId = null,
}) {
  const cookieHeader = sanitizeCookie(rawCookie || "")

  // CSRF未指定なら記事ページから取得（同一Cookieで）
  let token = csrfToken
  if (!token && articleId) {
    token = await fetchCsrfTokenFromArticle({ articleId, rawCookie: cookieHeader })
  }

  const url = `${ORIGIN}/api/bbs_tool/pokepoke/trades/${tradeId}/comments`
  const payload = { comment: { content, friend_name: friendName } }
  const headers = buildCommonHeaders({ csrfToken: token, articleId, withJson: true })
  headers["Authorization"] = `Bearer ${trainerId}`
  headers["Cookie"] = cookieHeader

  const res = await fetchWithTimeout(url, { method: "POST", headers, body: JSON.stringify(payload) }, 30000)
  return res
}

/* ===== CLI エントリポイント（ESM対応） ===== */
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  ;(async () => {
    const args = process.argv.slice(2)
    const getArg = (name) => {
      const i = args.indexOf(name)
      return i >= 0 && i + 1 < args.length ? args[i + 1] : null
    }

    const tradeId = getArg("--trade-id")
    const content = getArg("--content")
    const friendName = getArg("--friend-name")
    const trainerId = getArg("--trainer-id")
    const rawCookie = getArg("--raw-cookie") || RAW_COOKIE // 未指定ならRAW_COOKIE
    const csrfToken = getArg("--csrf-token")
    const articleId = getArg("--article-id")

    if (!tradeId || !content || !friendName || !trainerId) {
      console.error(
        "Usage: node postCommentGame8.js --trade-id <uuid> --content <text> --friend-name <name> --trainer-id <num> [--raw-cookie '<k=v; ...>'] [--csrf-token <token>] [--article-id <id>]",
      )
      process.exit(1)
    }

    try {
      const res = await postComment({
        tradeId,
        content,
        friendName,
        trainerId,
        rawCookie,
        csrfToken,
        articleId,
      })

      const xreq = res.headers.get("x-request-id")
      console.log(`HTTP ${res.status}`)
      if (xreq) console.log(`x-request-id: ${xreq}`)

      const ctype = res.headers.get("content-type") || ""
      const bodyText = await res.text()

      if (res.status === 201 && ctype.includes("application/json")) {
        try {
          const js = JSON.parse(bodyText)
          console.log(JSON.stringify(js, null, 2))
          console.log(`\n✅ 成功: comment_id=${js.id}`)
        } catch {
          console.log(bodyText)
          console.log("\n⚠️ 201ですがJSONパースに失敗。本文を確認してください。")
        }
      } else {
        console.log(bodyText)
        console.log("\n❌ 失敗。上の本文・ヘッダーを確認してください。")
        if (res.status === 401 || res.status === 403) {
          console.log("- Authorization(Bearer) / Cookie / x-csrf-token のいずれかが不正の可能性")
        }
        if (res.status === 422) {
          console.log("- payloadの検証エラー(content / friend_name など)")
        }
      }
    } catch (e) {
      console.error("❌ リクエストエラー:", e?.message || e)
      process.exit(2)
    }
  })()
}
