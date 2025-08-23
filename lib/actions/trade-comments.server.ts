// lib/actions/trade-comments.server.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // サーバ専用キー

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function addCommentServer(
  postId: string,
  content: string,
  userId?: string,
  userName?: string,
  isGuest?: boolean,
  guestId?: string,
) {
  try {
    const commentData = {
      trade_id: postId,
      content,
      user_id: userId || null,
      user_name: userName || "ゲスト",
      is_guest: Boolean(isGuest),
      guest_id: guestId || null,
      created_at: new Date().toISOString(),
    };

    console.time("[addComment] supabase.insert");
    const { data: comment, error: insertError } = await supabase
      .from("trade_comments")
      .insert(commentData)
      .select()
      .single();
    console.timeEnd("[addComment] supabase.insert");

    if (insertError) {
      console.error("[addComment] Insert error:", insertError);
      return { success: false, error: insertError.message };
    }

    // コメント数更新（失敗してもエラーにしない）
    const { error: updateError } = await supabase.rpc("increment_trade_comment_count", {
      trade_id: postId,
    });
    if (updateError) {
      console.warn("[addComment] Update error:", updateError);
    }

    return { success: true, comment };
  } catch (error: any) {
    console.error("[addComment] Unexpected error:", error);
    return { success: false, error: "コメントの投稿に失敗しました" };
  }
}

export async function getCommentsServer(postId: string) {
  try {
    const { data: comments, error } = await supabase
      .from("trade_comments")
      .select("*")
      .eq("trade_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, comments: comments || [] };
  } catch (error: any) {
    return { success: false, error: "コメントの取得に失敗しました" };
  }
}
