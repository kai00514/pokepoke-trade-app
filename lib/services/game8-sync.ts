import { createClient } from "@supabase/supabase-js"
import { postCommentToGame8, getGame8Config } from "./game8-client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function syncCommentToGame8(tradeCommentId: string, postId: string): Promise<void> {
  try {
    // 設定確認
    const config = getGame8Config()
    if (!config) {
      console.log("[Game8Sync] Disabled or not configured")
      return
    }

    // trade_postsからgame8_post_idを取得
    const { data: tradePost, error: tradeError } = await supabase
      .from("trade_posts")
      .select("game8_post_id")
      .eq("id", postId)
      .single()

    if (tradeError || !tradePost?.game8_post_id) {
      console.log("[Game8Sync] No game8_post_id found for trade:", postId)
      return
    }

    // コメント情報を取得
    const { data: comment, error: commentError } = await supabase
      .from("trade_comments")
      .select("content, user_name")
      .eq("id", tradeCommentId)
      .single()

    if (commentError || !comment) {
      console.error("[Game8Sync] Failed to get comment:", commentError)
      return
    }

    // Game8にコメント投稿
    const success = await postCommentToGame8(
      {
        tradeId: tradePost.game8_post_id,
        content: comment.content,
        friendName: comment.user_name || "ゲスト",
      },
      config,
    )

    if (success) {
      console.log("[Game8Sync] Success:", { tradeId: tradePost.game8_post_id, commentId: tradeCommentId })
    } else {
      console.error("[Game8Sync] Failed to post comment to Game8")
    }
  } catch (error) {
    console.error("[Game8Sync] Unexpected error:", error)
  }
}
