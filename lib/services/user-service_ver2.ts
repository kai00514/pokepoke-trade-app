import { createBrowserClient } from "@supabase/ssr"

// Supabaseクライアントのシングルトンインスタンス
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    console.log("🔧 [getSupabaseClient] Creating new Supabase client instance")
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "pkce",
          autoRefreshToken: true,
          persistSession: true,
        },
      },
    )
  }
  return supabaseInstance
}

async function getAuthSession() {
  console.log("🔧 [getAuthSession] Getting current auth session")
  const supabase = getSupabaseClient()

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log("🔧 [getAuthSession] Session data:", sessionData)

    if (sessionError) {
      console.error("🔧 [getAuthSession] Session error:", sessionError)
      return null
    }

    if (!sessionData.session) {
      console.log("🔧 [getAuthSession] No active session found")
      return null
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log("🔧 [getAuthSession] User data:", userData)

    if (userError) {
      console.error("🔧 [getAuthSession] User error:", userError)
      return null
    }

    return {
      session: sessionData.session,
      user: userData.user,
    }
  } catch (error) {
    console.error("🔧 [getAuthSession] Unexpected error:", error)
    return null
  }
}

export async function updateUserProfile(userId: string, profileData: any) {
  console.log("🔧 [updateUserProfile] START - Function called")
  console.log("🔧 [updateUserProfile] Input userId:", userId)
  console.log("🔧 [updateUserProfile] Input profileData:", profileData)

  try {
    // 方法1: サーバーサイドAPIを使用（最も確実）
    console.log("🔧 [updateUserProfile] Trying server-side API...")
    try {
      const response = await fetch("/api/users/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          profileData,
        }),
      })

      console.log("🔧 [updateUserProfile] API response status:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("🔧 [updateUserProfile] API success:", result)
        return { success: true, data: result.data }
      } else {
        const errorData = await response.json()
        console.error("🔧 [updateUserProfile] API error:", errorData)
      }
    } catch (apiError) {
      console.error("🔧 [updateUserProfile] API request failed:", apiError)
    }

    // 方法2: RPC関数を使用
    console.log("🔧 [updateUserProfile] Trying RPC function...")
    const supabase = getSupabaseClient()

    const authData = await getAuthSession()
    if (!authData) {
      throw new Error("認証されていません")
    }

    console.log("🔧 [updateUserProfile] Auth verified, calling RPC...")

    const { data: rpcData, error: rpcError } = await supabase.rpc("admin_update_user_profile", {
      target_user_id: userId,
      profile_updates: profileData,
    })

    if (rpcError) {
      console.error("🔧 [updateUserProfile] RPC error:", rpcError)
    } else {
      console.log("🔧 [updateUserProfile] RPC success:", rpcData)
      return { success: true, data: rpcData }
    }

    // 方法3: 直接テーブル更新（最後の手段）
    console.log("🔧 [updateUserProfile] Trying direct table update...")

    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update(profileData)
      .eq("id", userId)
      .select()

    if (updateError) {
      console.error("🔧 [updateUserProfile] Direct update error:", updateError)
      throw updateError
    }

    console.log("🔧 [updateUserProfile] Direct update success:", updateData)
    return { success: true, data: updateData }
  } catch (error) {
    console.error("🔧 [updateUserProfile] All methods failed:", error)
    throw error
  }
}

export async function getUserProfile(userId: string) {
  console.log("🔧 [getUserProfile] Getting user profile for:", userId)

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("🔧 [getUserProfile] Error:", error)
      return null
    }

    console.log("🔧 [getUserProfile] Success:", data)
    return data
  } catch (error) {
    console.error("🔧 [getUserProfile] Unexpected error:", error)
    return null
  }
}
