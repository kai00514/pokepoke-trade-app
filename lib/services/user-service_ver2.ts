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

// 現在の認証セッションを取得する関数（タイムアウト付き）
async function getAuthSession() {
  console.log("🔧 [getAuthSession] Getting current auth session")

  const supabase = getSupabaseClient()

  try {
    // タイムアウトを設定（5秒）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Session timeout")), 5000)
    })

    const sessionPromise = supabase.auth.getSession()

    const { data: sessionData, error: sessionError } = (await Promise.race([sessionPromise, timeoutPromise])) as any

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

    // セッション取得に失敗した場合は、直接APIを使用
    console.log("🔧 [getAuthSession] Session failed, will use API fallback")
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
    // 1. 認証セッションを確認（タイムアウト付き）
    console.log("🔧 [updateUserProfile] Step 1: Getting auth session")
    const session = await getAuthSession()

    if (session && session.user && session.user.id !== userId) {
      console.error("❌ [updateUserProfile] User ID mismatch:", {
        sessionUserId: session.user.id,
        requestedUserId: userId,
      })
      throw new Error("ユーザーIDが一致しません。")
    }

    console.log("✅ [updateUserProfile] Authentication check completed")

    // 2. サーバーサイドAPIを直接使用（最も確実な方法）
    console.log("🔧 [updateUserProfile] Step 2: Using server-side API for update")
    return await updateViaAPI(userId, profileData)
  } catch (error) {
    console.error("❌ [updateUserProfile] Error in updateUserProfile:", error)
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
    const requestBody = {
      userId,
      profileData,
    }

    console.log("🔧 [updateViaAPI] Request body:", requestBody)

    const response = await fetch("/api/users/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("🔧 [updateViaAPI] API response status:", response.status)
    console.log("🔧 [updateViaAPI] API response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [updateViaAPI] API error response:", errorText)
      throw new Error(`API update failed (${response.status}): ${errorText}`)
    }

    const result = await response.json()
    console.log("✅ [updateViaAPI] API update successful:", result)
    return result.data
  } catch (error) {
    console.error("❌ [updateViaAPI] API update error:", error)
    throw error
  }
}
