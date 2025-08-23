import { createClient } from "@supabase/supabase-js"
import { postCommentToGame8 } from "./game8-client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Game8Config {
  trainerId: string
  articleId: string
  rawCookie: string
  enabled: boolean
  timeout: number
}

/** 環境変数からGame8設定を取得 */
function getGame8Config(): Game8Config | null {
  const enabled = process.env.GAME8_SYNC_ENABLED === "true"
  const trainerId = process.env.GAME8_TRAINER_ID
  const articleId = process.env.GAME8_ARTICLE_ID
  const rawCookie = process.env.GAME8_RAW_COOKIE
  const timeout = Number.parseInt(process.env.GAME8_REQUEST_TIMEOUT || "30000")

  if (!enabled) {
    console.log("[Game8Sync] Game8 sync is disabled")
    return null
  }

  if (!trainerId || !articleId || !rawCookie) {
    console.warn("[Game8Sync] ⚠️ Game8 configuration incomplete", {
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
    timeout,
  }
}

/** Game8にコメントを同期 */
export async function syncCommentToGame8(tradeCommentId: string, postId: string): Promise<void> {
  const startTime = Date.now()

  console.log("[Game8Sync] Starting sync process", {
    tradeCommentId,
    postId,
  })

  try {
    // Game8設定を取得
    const config = getGame8Config()
    if (!config) {
      console.log("[Game8Sync] Sync skipped - configuration not available")
      return
    }

    // コメント情報を取得
    const { data: comment, error: commentError } = await supabase
      .from("trade_comments")
      .select("content, user_name")
      .eq("id", tradeCommentId)
      .single()

    if (commentError || !comment) {
      console.error("[Game8Sync] ❌ Failed to fetch comment", commentError)
      return
    }

    // トレード投稿のgame8_post_idを取得
    const { data: tradePost, error: tradeError } = await supabase
      .from("trade_posts")
      .select("game8_post_id")
      .eq("id", postId)
      .single()

    if (tradeError || !tradePost) {
      console.error("[Game8Sync] ❌ Failed to fetch trade post", tradeError)
      return
    }

    if (!tradePost.game8_post_id) {
      console.log("[Game8Sync] No game8_post_id found - sync skipped", { postId })
      return
    }

    console.log("[Game8Sync] Retrieved data", {
      game8PostId: tradePost.game8_post_id,
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

    const duration = `${Date.now() - startTime}ms`

    if (success) {
      console.log("[Game8Sync] ✅ Sync completed successfully", {
        tradeCommentId,
        game8PostId: tradePost.game8_post_id,
        duration,
      })
    } else {
      console.error("[Game8Sync] ❌ Failed to post comment to Game8", {
        tradeCommentId,
        game8PostId: tradePost.game8_post_id,
        duration,
      })
    }
  } catch (error) {
    const duration = `${Date.now() - startTime}ms`
    console.error("[Game8Sync] ❌ Unexpected error during sync", {
      tradeCommentId,
      postId,
      error: error instanceof Error ? error.message : String(error),
      duration,
    })
  }
}
