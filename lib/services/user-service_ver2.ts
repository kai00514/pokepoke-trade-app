import { createClient } from "@/lib/supabase/client"

export interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  name?: string
  avatar_url?: string
  created_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log("🔍 [getUserProfile] START - Fetching user profile for:", userId)

  try {
    const supabase = createClient()

    // セッション確認
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ [getUserProfile] Session error:", sessionError)
      throw new Error(`認証エラー: ${sessionError.message}`)
    }

    if (!session?.user) {
      console.error("❌ [getUserProfile] No session")
      throw new Error("認証されていません")
    }

    console.log("🔍 [getUserProfile] Session confirmed, fetching profile...")

    // ユーザープロファイル取得
    const { data, error } = await supabase
      .from("users")
      .select("id, pokepoke_id, display_name, name, avatar_url, created_at")
      .eq("id", userId)
      .single()

    console.log("🔍 [getUserProfile] Query result:", {
      hasData: !!data,
      error,
      data,
    })

    if (error) {
      if (error.code === "PGRST116") {
        console.log("🔍 [getUserProfile] User profile not found, returning null")
        return null
      }
      console.error("❌ [getUserProfile] Query error:", error)
      throw new Error(`プロファイル取得エラー: ${error.message}`)
    }

    console.log("✅ [getUserProfile] Profile found:", data)
    return data
  } catch (error) {
    console.error("❌ [getUserProfile] Error:", error)
    throw error
  }
}

export async function createUserProfile(userId: string, email: string): Promise<UserProfile> {
  console.log("🔧 [createUserProfile] START - Creating profile for:", { userId, email })

  try {
    const supabase = createClient()

    // セッション確認
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ [createUserProfile] Session error:", sessionError)
      throw new Error(`認証エラー: ${sessionError.message}`)
    }

    if (!session?.user) {
      console.error("❌ [createUserProfile] No session")
      throw new Error("認証されていません")
    }

    // ユーザープロファイル作成
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        display_name: email.split("@")[0], // デフォルトの表示名
      })
      .select()
      .single()

    console.log("🔧 [createUserProfile] Insert result:", {
      hasData: !!data,
      error,
      data,
    })

    if (error) {
      console.error("❌ [createUserProfile] Insert error:", error)
      throw new Error(`プロファイル作成エラー: ${error.message}`)
    }

    console.log("✅ [createUserProfile] Profile created:", data)
    return data
  } catch (error) {
    console.error("❌ [createUserProfile] Error:", error)
    throw error
  }
}

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

    // 直接テーブル更新
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
