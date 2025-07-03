import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// シングルトンパターンでクライアントを管理（重複作成を防ぐ）
let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    console.log("🔧 [getSupabaseClient] Creating new Supabase client instance")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are not set")
    }

    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  } else {
    console.log("🔧 [getSupabaseClient] Using existing Supabase client instance")
  }

  return supabaseInstance
}

// 現在の認証セッションを取得する関数
async function getAuthSession() {
  console.log("🔧 [getAuthSession] Getting current auth session")

  const supabase = getSupabaseClient()

  try {
    // セッション情報を取得
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    console.log("🔧 [getAuthSession] Session query completed")

    if (sessionError) {
      console.error("❌ [getAuthSession] Session error:", sessionError)
      throw sessionError
    }

    console.log("🔧 [getAuthSession] Session data:", {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      email: sessionData.session?.user?.email,
      accessToken: sessionData.session?.access_token ? "present" : "missing",
    })

    return sessionData.session
  } catch (error) {
    console.error("❌ [getAuthSession] Error getting session:", error)
    throw error
  }
}

// ユーザープロファイルを取得する関数
export async function getUserProfile(userId: string) {
  console.log("🔍 [getUserProfile] Getting user profile for:", userId)

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("❌ [getUserProfile] Error:", error)
      return null
    }

    console.log("✅ [getUserProfile] Profile retrieved:", data)
    return data
  } catch (error) {
    console.error("❌ [getUserProfile] Exception:", error)
    return null
  }
}

// ユーザープロファイルを更新する関数
export async function updateUserProfile(
  userId: string,
  profileData: {
    display_name?: string
    pokepoke_id?: string
    name?: string
    avatar_url?: string
  },
) {
  console.log("🔧 [updateUserProfile] START - Function called")
  console.log("🔧 [updateUserProfile] Input userId:", userId)
  console.log("🔧 [updateUserProfile] Input profileData:", profileData)

  try {
    // 1. 認証セッションを確認
    console.log("🔧 [updateUserProfile] Step 1: Getting auth session")
    const session = await getAuthSession()

    if (!session || !session.user) {
      console.error("❌ [updateUserProfile] No authenticated session found")
      throw new Error("認証されていません。再度ログインしてください。")
    }

    if (session.user.id !== userId) {
      console.error("❌ [updateUserProfile] User ID mismatch:", {
        sessionUserId: session.user.id,
        requestedUserId: userId,
      })
      throw new Error("ユーザーIDが一致しません。")
    }

    console.log("✅ [updateUserProfile] Authentication verified")

    // 2. RPC関数を使用して更新を試行
    console.log("🔧 [updateUserProfile] Step 2: Trying RPC function update")
    try {
      const result = await updateViaRPC(userId, profileData)
      if (result) {
        console.log("✅ [updateUserProfile] RPC update successful")
        return result
      }
    } catch (rpcError) {
      console.log("🔧 [updateUserProfile] RPC update failed, trying API fallback:", rpcError)
    }

    // 3. サーバーサイドAPIを使用して更新（フォールバック）
    console.log("🔧 [updateUserProfile] Step 3: Using server-side API for update")
    return await updateViaAPI(userId, profileData)
  } catch (error) {
    console.error("❌ [updateUserProfile] Error in updateUserProfile:", error)
    throw error
  }
}

// RPC関数による更新
async function updateViaRPC(
  userId: string,
  profileData: {
    display_name?: string
    pokepoke_id?: string
    name?: string
    avatar_url?: string
  },
) {
  console.log("🔧 [updateViaRPC] Starting RPC update")

  const supabase = getSupabaseClient()

  try {
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    console.log("🔧 [updateViaRPC] Calling admin_update_user_profile with:", { userId, updateData })

    const { data, error } = await supabase.rpc("admin_update_user_profile", {
      user_id: userId,
      update_data: updateData,
    })

    if (error) {
      console.error("❌ [updateViaRPC] RPC error:", error)
      throw error
    }

    console.log("✅ [updateViaRPC] RPC update successful:", data)
    return Array.isArray(data) ? data[0] : data
  } catch (error) {
    console.error("❌ [updateViaRPC] RPC update error:", error)
    throw error
  }
}

// サーバーサイドAPIによる更新
async function updateViaAPI(
  userId: string,
  profileData: {
    display_name?: string
    pokepoke_id?: string
    name?: string
    avatar_url?: string
  },
) {
  console.log("🔧 [updateViaAPI] Starting API update")

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

    console.log("🔧 [updateViaAPI] API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [updateViaAPI] API error response:", errorText)
      throw new Error(`API update failed: ${errorText}`)
    }

    const result = await response.json()
    console.log("✅ [updateViaAPI] API update successful:", result)
    return result.data
  } catch (error) {
    console.error("❌ [updateViaAPI] API update error:", error)
    throw error
  }
}

// 直接データベース更新を試行する関数（フォールバック用）
export async function updateUserProfileDirect(
  userId: string,
  profileData: {
    display_name?: string
    pokepoke_id?: string
    name?: string
    avatar_url?: string
  },
) {
  console.log("🔧 [updateUserProfileDirect] Starting direct database update")

  const supabase = getSupabaseClient()

  try {
    // 現在のセッションを確認
    const { data: sessionData } = await supabase.auth.getSession()
    console.log("🔧 [updateUserProfileDirect] Current session:", {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
    })

    // 更新実行
    const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

    if (error) {
      console.error("❌ [updateUserProfileDirect] Database error:", error)
      throw error
    }

    console.log("✅ [updateUserProfileDirect] Direct update successful:", data)
    return data
  } catch (error) {
    console.error("❌ [updateUserProfileDirect] Direct update error:", error)
    throw error
  }
}
