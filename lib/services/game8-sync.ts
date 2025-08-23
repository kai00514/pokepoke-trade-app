import { createClient } from "@supabase/supabase-js"
import { postCommentToGame8, getGame8Config } from "./game8-client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function syncCommentToGame8(tradeCommentId: string, postId: string): Promise<void> {
  const startTime = Date.now()
  console.log(`[Game8Sync] Starting sync process`, {
    tradeCommentId,
    postId,
    timestamp: new Date().toISOString(),
  })

  try {
    // 設定確認
    const config = getGame8Config()
    if (!config) {
      console.log(`[Game8Sync] Sync disabled or not configured - skipping`)
      return
    }

    console.log(`[Game8Sync] Configuration loaded successfully`)

    // trade_postsからgame8_post_idを取得
    console.log(`[Game8Sync] Fetching trade post data for postId: ${postId}`)
    const { data: tradePost, error: tradeError } = await supabase
      .from("trade_posts")
      .select("game8_post_id")
      .eq("id", postId)
      .single()

    if (tradeError) {
      console.error(`[Game8Sync] Failed to fetch trade post`, {
        postId,
        error: tradeError.message,
        code: tradeError.code,
      })
      return
    }

    if (!tradePost?.game8_post_id) {
      console.log(`[Game8Sync] No game8_post_id found for trade`, {
        postId,
        tradePost,
      })
      return
    }

    console.log(`[Game8Sync] Found game8_post_id: ${tradePost.game8_post_id}`)

    // コメント情報を取得
    console.log(`[Game8Sync] Fetching comment data for commentId: ${tradeCommentId}`)
    const { data: comment, error: commentError } = await supabase
      .from("trade_comments")
      .select("content, user_name")
      .eq("id", tradeCommentId)
      .single()

    if (commentError) {
      console.error(`[Game8Sync] Failed to fetch comment`, {
        tradeCommentId,
        error: commentError.message,
        code: commentError.code,
      })
      return
    }

    if (!comment) {
      console.error(`[Game8Sync] Comment not found`, { tradeCommentId })
      return
    }

    console.log(`[Game8Sync] Comment data retrieved`, {
      contentLength: comment.content?.length || 0,
      userName: comment.user_name || "ゲスト",
    })

    // Game8にコメント投稿
    console.log(`[Game8Sync] Attempting to post comment to Game8`)
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
        tradeCommentId,
        postId,
        game8PostId: tradePost.game8_post_id,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error(`[Game8Sync] ❌ Failed to post comment to Game8`, {
        tradeCommentId,
        postId,
        game8PostId: tradePost.game8_post_id,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Game8Sync] ❌ Unexpected error during sync`, {
      tradeCommentId,
      postId,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
  }
}
