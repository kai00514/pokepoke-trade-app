import { createClient } from "@supabase/supabase-js"
import { postCommentToGame8 } from "./game8-client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Game8Config {
  trainerId: string
  articleId: string
  rawCookie: string
  enabled: boolean
  timeout: number
}

function getGame8Config(): Game8Config | null {
  const enabled = process.env.GAME8_SYNC_ENABLED === "true"
  const trainerId = process.env.GAME8_TRAINER_ID
  const articleId = process.env.GAME8_ARTICLE_ID
  const rawCookie = process.env.GAME8_RAW_COOKIE

  if (!enabled) {
    console.log("[Game8Sync] Game8 sync is disabled")
    return null
  }

  if (!trainerId || !articleId || !rawCookie) {
    console.warn("[Game8Sync] Missing required environment variables:", {
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
}

export async function syncCommentToGame8(commentId: string, postId: string): Promise<void> {
  const startTime = Date.now()

  console.log(`[Game8Sync] Starting sync process`, {
    commentId,
    postId,
  })

  try {
    // 設定取得
    const config = getGame8Config()
    if (!config) {
      console.log(`[Game8Sync] Sync disabled or misconfigured`)
      return
    }

    // trade_postsからgame8_post_idを取得
    console.log(`[Game8Sync] Fetching game8_post_id for post: ${postId}`)
    const { data: tradePost, error: tradeError } = await supabase
      .from("trade_posts")
      .select("game8_post_id")
      .eq("id", postId)
      .single()

    if (tradeError) {
      console.error(`[Game8Sync] Failed to fetch trade post:`, tradeError)
      return
    }

    if (!tradePost?.game8_post_id) {
      console.log(`[Game8Sync] No game8_post_id found for post: ${postId}`)
      return
    }

    console.log(`[Game8Sync] Found game8_post_id: ${tradePost.game8_post_id}`)

    // コメント情報を取得
    const { data: comment, error: commentError } = await supabase
      .from("trade_comments")
      .select("content, user_name")
      .eq("id", commentId)
      .single()

    if (commentError) {
      console.error(`[Game8Sync] Failed to fetch comment:`, commentError)
      return
    }

    console.log(`[Game8Sync] Comment data retrieved`, {
      contentLength: comment.content.length,
      userName: comment.user_name,
    })

    // Game8にコメント投稿
    const success = await postCommentToGame8(
      {
        tradeId: tradePost.game8_post_id,
        content: comment.content,
        friendName: comment.user_name || "ゲスト",
      },
      config,
    )

    const duration = Date.now() - startTime

    if (success) {
      console.log(`[Game8Sync] ✅ Sync completed successfully`, {
        commentId,
        game8PostId: tradePost.game8_post_id,
        duration: `${duration}ms`,
      })
    } else {
      console.error(`[Game8Sync] ❌ Failed to post comment to Game8`, {
        commentId,
        game8PostId: tradePost.game8_post_id,
        duration: `${duration}ms`,
      })
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Game8Sync] ❌ Unexpected error in sync process:`, {
      error: error instanceof Error ? error.message : String(error),
      commentId,
      postId,
      duration: `${duration}ms`,
    })
  }
}
