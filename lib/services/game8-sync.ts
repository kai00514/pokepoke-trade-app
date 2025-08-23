import { createClient } from "@supabase/supabase-js"

console.log("[DEBUG] game8-sync.ts loaded")

// Game8クライアントのインポートテスト
let postCommentToGame8: any = null
let getGame8Config: any = null
let clientImportError: any = null

try {
  console.log("[DEBUG] Importing game8-client...")
  const game8ClientModule = await import("./game8-client")
  postCommentToGame8 = game8ClientModule.postCommentToGame8
  getGame8Config = game8ClientModule.getGame8Config
  console.log("[DEBUG] ✅ game8-client imported successfully")
  console.log("[DEBUG] postCommentToGame8 type:", typeof postCommentToGame8)
  console.log("[DEBUG] getGame8Config type:", typeof getGame8Config)
} catch (error) {
  clientImportError = error
  console.error("[DEBUG] ❌ Failed to import game8-client:", error)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function syncCommentToGame8(commentId: string, postId: string): Promise<void> {
  const startTime = Date.now()

  console.log(`[Game8Sync] ===== STARTING SYNC PROCESS =====`)
  console.log(`[Game8Sync] Function called with:`)
  console.log(`[Game8Sync] - Comment ID: ${commentId}`)
  console.log(`[Game8Sync] - Post ID: ${postId}`)
  console.log(`[Game8Sync] - Timestamp: ${new Date().toISOString()}`)
  console.log(`[Game8Sync] - postCommentToGame8 available: ${typeof postCommentToGame8}`)
  console.log(`[Game8Sync] - getGame8Config available: ${typeof getGame8Config}`)
  console.log(`[Game8Sync] - Client import error: ${clientImportError}`)

  try {
    // 設定取得
    console.log(`[Game8Sync] Getting Game8 configuration...`)

    if (!getGame8Config || typeof getGame8Config !== "function") {
      console.error(`[Game8Sync] ❌ getGame8Config is not available`)
      console.error(`[Game8Sync] Type: ${typeof getGame8Config}`)
      console.error(`[Game8Sync] Import error: ${clientImportError}`)
      return
    }

    const config = getGame8Config()
    console.log(`[Game8Sync] Config result:`, config)

    if (!config) {
      console.log(`[Game8Sync] ❌ Sync disabled or misconfigured - STOPPING`)
      return
    }
    console.log(`[Game8Sync] ✅ Configuration loaded successfully`)

    // trade_postsからgame8_post_idを取得
    console.log(`[Game8Sync] Fetching game8_post_id for post: ${postId}`)
    const { data: tradePost, error: tradeError } = await supabase
      .from("trade_posts")
      .select("game8_post_id")
      .eq("id", postId)
      .single()

    console.log(`[Game8Sync] Trade post query result:`)
    console.log(`[Game8Sync] - Data:`, tradePost)
    console.log(`[Game8Sync] - Error:`, tradeError)

    if (tradeError) {
      console.error(`[Game8Sync] ❌ Failed to fetch trade post:`, tradeError)
      return
    }

    if (!tradePost?.game8_post_id) {
      console.log(`[Game8Sync] ❌ No game8_post_id found for post: ${postId} - STOPPING`)
      console.log(`[Game8Sync] Trade post data:`, tradePost)
      return
    }

    console.log(`[Game8Sync] ✅ Found game8_post_id: ${tradePost.game8_post_id}`)

    // コメント情報を取得
    console.log(`[Game8Sync] Fetching comment data for comment: ${commentId}`)
    const { data: comment, error: commentError } = await supabase
      .from("trade_comments")
      .select("content, user_name, guest_name")
      .eq("id", commentId)
      .single()

    console.log(`[Game8Sync] Comment query result:`)
    console.log(`[Game8Sync] - Data:`, comment)
    console.log(`[Game8Sync] - Error:`, commentError)

    if (commentError) {
      console.error(`[Game8Sync] ❌ Failed to fetch comment:`, commentError)
      return
    }

    if (!comment) {
      console.error(`[Game8Sync] ❌ Comment not found: ${commentId}`)
      return
    }

    // フレンド名の決定（ゲストの場合はguest_name、ユーザーの場合はuser_name）
    const friendName = comment.guest_name || comment.user_name || "ゲスト"

    console.log(`[Game8Sync] ✅ Comment data retrieved:`)
    console.log(`[Game8Sync] - Content length: ${comment.content.length}`)
    console.log(`[Game8Sync] - Friend name: ${friendName}`)
    console.log(`[Game8Sync] - Content preview: ${comment.content.substring(0, 50)}...`)

    // Game8にコメント投稿
    console.log(`[Game8Sync] Attempting to post comment to Game8...`)

    if (!postCommentToGame8 || typeof postCommentToGame8 !== "function") {
      console.error(`[Game8Sync] ❌ postCommentToGame8 is not available`)
      console.error(`[Game8Sync] Type: ${typeof postCommentToGame8}`)
      console.error(`[Game8Sync] Import error: ${clientImportError}`)
      return
    }

    const success = await postCommentToGame8(
      {
        tradeId: tradePost.game8_post_id,
        content: comment.content,
        friendName: friendName,
      },
      config,
    )

    const duration = Date.now() - startTime

    if (success) {
      console.log(`[Game8Sync] ✅ ===== SYNC COMPLETED SUCCESSFULLY =====`)
      console.log(`[Game8Sync] Comment ID: ${commentId}`)
      console.log(`[Game8Sync] Game8 Post ID: ${tradePost.game8_post_id}`)
      console.log(`[Game8Sync] Duration: ${duration}ms`)
    } else {
      console.error(`[Game8Sync] ❌ ===== SYNC FAILED =====`)
      console.error(`[Game8Sync] Comment ID: ${commentId}`)
      console.error(`[Game8Sync] Game8 Post ID: ${tradePost.game8_post_id}`)
      console.error(`[Game8Sync] Duration: ${duration}ms`)
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Game8Sync] ❌ ===== UNEXPECTED ERROR IN SYNC =====`)
    console.error(`[Game8Sync] Error:`, error instanceof Error ? error.message : String(error))
    console.error(`[Game8Sync] Stack:`, error instanceof Error ? error.stack : undefined)
    console.error(`[Game8Sync] Comment ID: ${commentId}`)
    console.error(`[Game8Sync] Post ID: ${postId}`)
    console.error(`[Game8Sync] Duration: ${duration}ms`)
  }
}
