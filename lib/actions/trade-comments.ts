import { createClient } from "@supabase/supabase-js"

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

    // === 次の thread_comment_number を計算 ===
    const { count, error: countError } = await supabase
      .from("trade_comments")
      .select("*", { count: "exact", head: true })
      .eq("trade_id", postId)

    if (countError) {
      console.error("[addComment] Count error:", countError)
      return { success: false, error: "thread_comment_number の計算に失敗しました" }
    }

    const nextThreadNumber = (count ?? 0) + 1
    console.log("[addComment] Next thread number:", nextThreadNumber)

    // === コメントデータ作成 ===
    const commentData = {
      trade_id: postId,
      content,
      user_id: userId || null,
      user_name: userName || "ゲスト",
      is_guest: isGuest || false,
      guest_id: guestId || null,
      thread_comment_number: nextThreadNumber,
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
      return { success: false, error: insertError.message }
    }

    console.log("[addComment] Comment inserted successfully. Data:", comment)

    // コメント数を更新
    const { error: updateError } = await supabase.rpc("increment_trade_comment_count", {
      trade_id: postId,
    })

    if (updateError) {
      console.error("[addComment] Update error:", updateError)
      // コメント数の更新に失敗してもコメント自体は成功とする
    }

    return { success: true, comment }
  } catch (error) {
    console.error("[addComment] Unexpected error:", error)
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
