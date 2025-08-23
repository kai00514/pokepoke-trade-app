import { createClient } from "@supabase/supabase-js"

// デバッグ: インポートテスト
console.log("[DEBUG] trade-comments.ts loaded - checking imports...")

let syncCommentToGame8: any = null
let importError: any = null

try {
  console.log("[DEBUG] Attempting to import syncCommentToGame8...")
  const game8SyncModule = await import("../services/game8-sync")
  syncCommentToGame8 = game8SyncModule.syncCommentToGame8
  console.log("[DEBUG] ✅ syncCommentToGame8 imported successfully:", typeof syncCommentToGame8)
} catch (error) {
  importError = error
  console.error("[DEBUG] ❌ Failed to import syncCommentToGame8:", error)
  console.error("[DEBUG] Import error details:", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// クライアントサイド用のSupabaseクライアント
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function addComment(
  postId: string,
  content: string,
  userId?: string,
  userName?: string,
  isGuest?: boolean,
  guestId?: string,
) {
  try {
    console.log("[addComment] Starting with params:", { postId, content, userId, userName, isGuest })
    console.log("[addComment] Debug: userId received:", userId, " (type:", typeof userId, ")")
    console.log("[addComment] Debug: isGuest received:", isGuest, " (type:", typeof isGuest, ")")

    const commentData = {
      trade_id: postId,
      content,
      user_id: userId || null,
      user_name: userName || "ゲスト",
      is_guest: isGuest || false,
      guest_id: guestId || null,
      created_at: new Date().toISOString(),
    }

    console.log("[addComment] Inserting comment data:", commentData)

    const { data: comment, error: insertError } = await supabase
      .from("trade_comments")
      .insert(commentData)
      .select()
      .single()

    if (insertError) {
      console.error("[addComment] Insert error:", insertError)
      console.error("[addComment] Insert error details:", insertError.details)
      console.error("[addComment] Insert error hint:", insertError.hint)
      console.error("[addComment] Insert error code:", insertError.code)
      return { success: false, error: insertError.message }
    }
    console.log("[addComment] Comment inserted successfully. Data:", comment)

    // コメント数を更新
    const { error: updateError } = await supabase.rpc("increment_trade_comment_count", {
      trade_id: postId,
    })

    if (updateError) {
      console.error("[addComment] Update error:", updateError)
    }

    // Game8連携を非同期で実行
    console.log("[addComment] ===== GAME8 SYNC CHECK =====")
    console.log("[addComment] Comment exists:", !!comment)
    console.log("[addComment] syncCommentToGame8 function:", typeof syncCommentToGame8)
    console.log("[addComment] Import error:", importError)

    if (comment) {
      console.log("[addComment] ===== STARTING GAME8 SYNC =====")
      console.log("[addComment] Comment ID:", comment.id)
      console.log("[addComment] Post ID:", postId)

      if (syncCommentToGame8 && typeof syncCommentToGame8 === "function") {
        console.log("[addComment] Calling syncCommentToGame8...")
        Promise.resolve()
          .then(() => {
            console.log("[addComment] Executing syncCommentToGame8...")
            return syncCommentToGame8(comment.id, postId)
          })
          .then(() => {
            console.log("[addComment] ✅ Game8 sync completed")
          })
          .catch((error) => {
            console.error("[addComment] ❌ Game8 sync failed:", error)
            console.error("[addComment] Game8 sync error stack:", error.stack)
          })
      } else {
        console.error("[addComment] ❌ syncCommentToGame8 is not available")
        console.error("[addComment] Function type:", typeof syncCommentToGame8)
        console.error("[addComment] Import error:", importError)
      }
    } else {
      console.error("[addComment] ❌ Comment is null/undefined")
    }

    return { success: true, comment }
  } catch (error) {
    console.error("[addComment] Unexpected error:", error)
    console.error("[addComment] Error stack:", error instanceof Error ? error.stack : undefined)
    return { success: false, error: "コメントの投稿に失敗しました" }
  }
}

export async function addCommentToTradePost(
  postId: string,
  content: string,
  isGuest = false,
  userId?: string,
  userName?: string,
  guestName?: string,
) {
  try {
    console.log("[addCommentToTradePost] ===== FUNCTION START =====")
    console.log("[addCommentToTradePost] File version: GAME8_DEBUG_v2.0")
    console.log("[addCommentToTradePost] User ID:", userId, "Is authenticated:", !!userId)
    console.log("[addCommentToTradePost] Guest name:", guestName)
    console.log("[addCommentToTradePost] syncCommentToGame8 available:", typeof syncCommentToGame8)
    console.log("[addCommentToTradePost] Import error:", importError)

    const commentData = {
      post_id: postId,
      content,
      is_guest: isGuest,
      user_id: userId || null,
      user_name: userName || null,
      guest_name: guestName || null,
      created_at: new Date().toISOString(),
    }

    console.log("[addCommentToTradePost] Insert data:", commentData)
    console.log("[addCommentToTradePost] Insert data2:", commentData)

    const { data: comment, error: insertError } = await supabase
      .from("trade_comments")
      .insert(commentData)
      .select()
      .single()
    console.log("comment_data finish")

    if (insertError) {
      console.error("[addCommentToTradePost] Insert error:", insertError)
      return { success: false, error: insertError.message }
    }

    console.log("[addCommentToTradePost] Comment inserted successfully:", comment)

    // ===== GAME8連携デバッグ =====
    console.log("[addCommentToTradePost] ===== GAME8 SYNC DEBUG =====")
    console.log("[addCommentToTradePost] Comment exists:", !!comment)
    console.log("[addCommentToTradePost] Comment ID:", comment?.id)
    console.log("[addCommentToTradePost] Post ID:", postId)
    console.log("[addCommentToTradePost] syncCommentToGame8 type:", typeof syncCommentToGame8)
    console.log("[addCommentToTradePost] syncCommentToGame8 value:", syncCommentToGame8)
    console.log("[addCommentToTradePost] Import error:", importError)

    if (comment) {
      console.log("[addCommentToTradePost] ===== STARTING GAME8 SYNC =====")
      console.log("[addCommentToTradePost] Comment ID:", comment.id)
      console.log("[addCommentToTradePost] Post ID:", postId)

      if (syncCommentToGame8 && typeof syncCommentToGame8 === "function") {
        console.log("[addCommentToTradePost] Calling syncCommentToGame8...")

        try {
          Promise.resolve()
            .then(() => {
              console.log("[addCommentToTradePost] Executing syncCommentToGame8...")
              return syncCommentToGame8(comment.id, postId)
            })
            .then(() => {
              console.log("[addCommentToTradePost] ✅ Game8 sync completed successfully")
            })
            .catch((error) => {
              console.error("[addCommentToTradePost] ❌ Game8 sync failed:", error)
              console.error("[addCommentToTradePost] Game8 sync error message:", error.message)
              console.error("[addCommentToTradePost] Game8 sync error stack:", error.stack)
            })
        } catch (syncError) {
          console.error("[addCommentToTradePost] ❌ Error in Promise setup:", syncError)
        }
      } else {
        console.error("[addCommentToTradePost] ❌ syncCommentToGame8 is not available")
        console.error("[addCommentToTradePost] Function type:", typeof syncCommentToGame8)
        console.error("[addCommentToTradePost] Function value:", syncCommentToGame8)
        console.error("[addCommentToTradePost] Import error details:", importError)

        // 再インポートを試行
        console.log("[addCommentToTradePost] Attempting re-import...")
        try {
          const game8SyncModule = await import("../services/game8-sync")
          const reimportedFunction = game8SyncModule.syncCommentToGame8
          console.log("[addCommentToTradePost] Re-import result:", typeof reimportedFunction)

          if (reimportedFunction && typeof reimportedFunction === "function") {
            console.log("[addCommentToTradePost] Using re-imported function...")
            Promise.resolve()
              .then(() => reimportedFunction(comment.id, postId))
              .catch((error) => {
                console.error("[addCommentToTradePost] ❌ Re-imported function failed:", error)
              })
          }
        } catch (reimportError) {
          console.error("[addCommentToTradePost] ❌ Re-import failed:", reimportError)
        }
      }
    } else {
      console.error("[addCommentToTradePost] ❌ Comment is null/undefined")
    }

    console.log("[addCommentToTradePost] ===== FUNCTION END =====")
    return { success: true, comment }
  } catch (error) {
    console.error("[addCommentToTradePost] Unexpected error:", error)
    console.error("[addCommentToTradePost] Error stack:", error instanceof Error ? error.stack : undefined)
    return { success: false, error: "コメントの投稿に失敗しました" }
  }
}

export async function getComments(postId: string) {
  try {
    console.log("[getComments] Fetching comments for postId:", postId)

    const { data: comments, error } = await supabase
      .from("trade_comments")
      .select("*")
      .eq("trade_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[getComments] Error:", error)
      return { success: false, error: error.message }
    }

    console.log("[getComments] Comments fetched successfully:", comments?.length)
    return { success: true, comments: comments || [] }
  } catch (error) {
    console.error("[getComments] Unexpected error:", error)
    return { success: false, error: "コメントの取得に失敗しました" }
  }
}
