import { spawn } from "child_process"
import path from "path"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Game8CommentParams {
  tradeId: string
  content: string
  friendName: string
  trainerId: string
  articleId: string
  rawCookie?: string
}

/**
 * Game8にコメントを投稿する
 */
export async function postCommentToGame8(params: Game8CommentParams): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts", "postCommentGame8.js")

    const args = [
      "--trade-id",
      params.tradeId,
      "--content",
      params.content,
      "--friend-name",
      params.friendName,
      "--trainer-id",
      params.trainerId,
      "--article-id",
      params.articleId,
    ]

    if (params.rawCookie) {
      args.push("--raw-cookie", params.rawCookie)
    }

    console.log("[Game8] Executing script with args:", args)

    const child = spawn("node", [scriptPath, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000, // 30秒タイムアウト
    })

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", (data) => {
      stdout += data.toString()
    })

    child.stderr?.on("data", (data) => {
      stderr += data.toString()
    })

    child.on("close", (code) => {
      console.log("[Game8] Script finished with code:", code)
      console.log("[Game8] stdout:", stdout)

      if (stderr) {
        console.error("[Game8] stderr:", stderr)
      }

      if (code === 0) {
        console.log("[Game8] Comment posted successfully")
        resolve()
      } else {
        console.error("[Game8] Script failed with code:", code)
        reject(new Error(`Game8 script failed with code ${code}: ${stderr}`))
      }
    })

    child.on("error", (error) => {
      console.error("[Game8] Script execution error:", error)
      reject(error)
    })
  })
}

/**
 * トレード投稿のGame8 IDを取得する
 */
export async function getGame8PostId(tradePostId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.from("trade_posts").select("game8_post_id").eq("id", tradePostId).single()

    if (error) {
      console.error("[Game8] Error fetching game8_post_id:", error)
      return null
    }

    return data?.game8_post_id || null
  } catch (error) {
    console.error("[Game8] Unexpected error fetching game8_post_id:", error)
    return null
  }
}

/**
 * Game8連携が有効かどうかを確認
 */
export function isGame8IntegrationEnabled(): boolean {
  return process.env.GAME8_ENABLED === "true"
}

/**
 * Game8連携のパラメータを取得
 */
export function getGame8Config() {
  return {
    trainerId: process.env.GAME8_TRAINER_ID || "",
    articleId: process.env.GAME8_ARTICLE_ID || "",
    rawCookie: process.env.GAME8_RAW_COOKIE || "",
  }
}

/**
 * Game8にコメントを投稿する（エラーハンドリング付き）
 */
export async function executeGame8CommentPost(tradePostId: string, content: string, userName: string): Promise<void> {
  try {
    // 機能が無効な場合は何もしない
    if (!isGame8IntegrationEnabled()) {
      console.log("[Game8] Integration is disabled")
      return
    }

    // Game8 IDを取得
    const game8PostId = await getGame8PostId(tradePostId)
    if (!game8PostId) {
      console.log("[Game8] No game8_post_id found for trade:", tradePostId)
      return
    }

    // 設定を取得
    const config = getGame8Config()
    if (!config.trainerId || !config.articleId) {
      console.error("[Game8] Missing required configuration (trainerId or articleId)")
      return
    }

    // Game8にコメント投稿
    await postCommentToGame8({
      tradeId: game8PostId,
      content: content,
      friendName: userName,
      trainerId: config.trainerId,
      articleId: config.articleId,
      rawCookie: config.rawCookie,
    })

    console.log("[Game8] Comment posted successfully for trade:", tradePostId)
  } catch (error) {
    // エラーが発生してもメインの処理には影響させない
    console.error("[Game8] Failed to post comment:", error)
  }
}
