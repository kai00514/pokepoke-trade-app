import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

    // 同じ post_id の件数を数えて +1
    const { count, error: countError } = await supabase
      .from("trade_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId) // ★ post_id が正

    if (countError) {
      console.error("[addComment] Count error:", countError)
      return { success: false, error: "thread_comment_number の計算に失敗しました" }
    }

    const nextThreadNumber = (count ?? 0) + 1
    console.log("[addComment] Next thread number:", nextThreadNumber)

    const commentData = {
      post_id: postId,                       // ★ post_id に統一
      content,
      user_id: userId || null,
      user_name: userName || "ゲスト",
      is_guest: isGuest || false,
      guest_id: guestId || null,
      thread_comment_number: nextThreadNumber, // ★ 計算値を必ず入れる
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

    // コメント数の更新（RPC引数名が trade_id のままならこのまま）
    const { error: updateError } = await supabase.rpc("increment_trade_comment_count", {
      trade_id: postId,
    })
    if (updateError) console.error("[addComment] Update error:", updateError)

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
      .eq("post_id", postId)                       // ★ post_id に統一
      .order("thread_comment_number", { ascending: true }) // ★ 連番で並べる
      .order("created_at", { ascending: true })            // タイブレーク用

    if (error) {
      console.error("[getComments] Error:", error)
      return { success: false, error: error.message }
    }

    // TEXT 型のままなら念のため数値ソートで補強
    const sorted = (comments ?? []).slice().sort((a, b) => {
      const na = Number(a.thread_comment_number ?? 0)
      const nb = Number(b.thread_comment_number ?? 0)
      if (na !== nb) return na - nb
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    console.log("[getComments] Comments fetched successfully:", sorted.length)
    return { success: true, comments: sorted }
  } catch (error) {
    console.error("[getComments] Unexpected error:", error)
    return { success: false, error: "コメントの取得に失敗しました" }
  }
}
