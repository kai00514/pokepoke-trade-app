import { createClient } from "@/lib/supabase/client"

export async function updateUserProfile(
  userId: string,
  profileData: {
    display_name?: string
    pokepoke_id?: string
    name?: string
    avatar_url?: string
  },
) {
  console.log("🔧 [updateUserProfile] START:", { userId, profileData })

  try {
    // AuthContextと同じSupabaseクライアントを使用
    const supabase = createClient()

    // 現在のセッション確認（AuthContextと同じ方法）
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log("🔧 [updateUserProfile] Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      sessionUserId: session?.user?.id,
      inputUserId: userId,
      sessionError,
    })

    if (sessionError) {
      console.error("❌ [updateUserProfile] Session error:", sessionError)
      throw new Error(`認証エラー: ${sessionError.message}`)
    }

    if (!session?.user) {
      console.error("❌ [updateUserProfile] No session or user")
      throw new Error("認証されていません。再度ログインしてください。")
    }

    if (session.user.id !== userId) {
      console.error("❌ [updateUserProfile] User ID mismatch")
      throw new Error("ユーザーIDが一致しません。")
    }

    // RPC関数呼び出し
    console.log("🔧 [updateUserProfile] Calling RPC...")
    const { data, error } = await supabase.rpc("admin_update_user_profile", {
      p_user_id: userId,
      p_update_data: profileData,
    })

    console.log("🔧 [updateUserProfile] RPC result:", {
      hasData: !!data,
      dataType: typeof data,
      isArray: Array.isArray(data),
      dataLength: Array.isArray(data) ? data.length : "N/A",
      error,
    })

    if (error) {
      console.error("❌ [updateUserProfile] RPC error:", error)
      throw new Error(`プロファイル更新エラー: ${error.message}`)
    }

    if (!data) {
      console.error("❌ [updateUserProfile] No data returned")
      throw new Error("プロファイルの更新に失敗しました。")
    }

    const result = Array.isArray(data) ? data[0] : data
    console.log("✅ [updateUserProfile] Success:", result)
    return result
  } catch (error) {
    console.error("❌ [updateUserProfile] Error:", error)
    throw error
  }
}
