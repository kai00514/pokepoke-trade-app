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
  console.log("🔧 [updateUserProfile] START - Direct table update:", { userId, profileData })

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

    // 直接テーブル更新（updated_atは削除）
    console.log("🔧 [updateUserProfile] Updating users table directly...")
    const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

    console.log("🔧 [updateUserProfile] Direct update result:", {
      hasData: !!data,
      error,
      updatedData: data,
    })

    if (error) {
      console.error("❌ [updateUserProfile] Update error:", error)
      throw new Error(`プロファイル更新エラー: ${error.message}`)
    }

    if (!data) {
      console.error("❌ [updateUserProfile] No data returned")
      throw new Error("プロファイルの更新に失敗しました。")
    }

    console.log("✅ [updateUserProfile] Success:", data)
    return data
  } catch (error) {
    console.error("❌ [updateUserProfile] Error:", error)
    throw error
  }
}
