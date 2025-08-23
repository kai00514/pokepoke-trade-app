"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { syncCommentToGame8 } from "@/lib/services/game8-sync"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function addComment(postId: string, content: string, userName?: string) {
  try {
    console.log(`[TradeComments] Adding comment to post: ${postId}`)

    const { data: comment, error } = await supabase
      .from("trade_comments")
      .insert({
        trade_id: postId,
        content,
        user_name: userName || "ゲスト",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error(`[TradeComments] Failed to add comment:`, error)
      throw error
    }

    console.log(`[TradeComments] Comment added successfully`, {
      commentId: comment.id,
      postId,
      contentLength: content.length,
    })

    // Game8連携を非同期で実行
    Promise.resolve()
      .then(async () => {
        console.log(`[TradeComments] Starting Game8 sync for comment: ${comment.id}`)
        await syncCommentToGame8(comment.id, postId)
      })
      .catch((error) => {
        console.error(`[TradeComments] Game8 sync failed for comment: ${comment.id}`, error)
      })

    revalidatePath(`/trades/${postId}`)

    return { success: true, comment }
  } catch (error) {
    console.error(`[TradeComments] Error in addComment:`, error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getComments(postId: string) {
  try {
    const { data: comments, error } = await supabase
      .from("trade_comments")
      .select("*")
      .eq("trade_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      throw error
    }

    return { success: true, comments }
  } catch (error) {
    console.error("Error fetching comments:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
