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

    // ユーザープロファイル作成（updated_atは削除）
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
