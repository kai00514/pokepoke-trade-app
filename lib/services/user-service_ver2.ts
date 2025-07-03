import { createClient } from "@supabase/supabase-js"

// 新しいSupabaseクライアントを毎回作成する関数
function createFreshClient() {
  console.log("🔧 [createFreshClient] Creating new Supabase client")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not set")
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
    },
  })
}

// 現在の認証セッションを取得する関数
async function getAuthSession() {
  console.log("🔧 [getAuthSession] Getting current auth session")

  const supabase = createFreshClient()

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ [getAuthSession] Session error:", sessionError)
      throw sessionError
    }

    console.log("🔧 [getAuthSession] Session data:", {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      email: sessionData.session?.user?.email,
    })

    return sessionData.session
  } catch (error) {
    console.error("❌ [getAuthSession] Error getting session:", error)
    throw error
  }
}

// ユーザープロファイルを更新する関数（複数の方法を試行）
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

    // 2. 標準的なクライアントサイド更新を試行
    console.log("🔧 [updateUserProfile] Attempting standard client-side update")

    const supabase = createFreshClient()

    // 現在のデータを取得
    console.log("🔧 [updateUserProfile] Fetching current user data")
    const { data: currentData, error: selectError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (selectError) {
      console.error("❌ [updateUserProfile] Error fetching current data:", selectError)

      // RLSエラーの場合は、RPC関数を試行
      if (selectError.code === "42501" || selectError.message?.includes("RLS")) {
        console.log("🔧 [updateUserProfile] RLS error detected, trying RPC function")
        return await updateViaRPC(userId, profileData)
      }

      throw selectError
    }

    console.log("✅ [updateUserProfile] Current data fetched:", currentData)

    // データを更新
    console.log("🔧 [updateUserProfile] Updating user data")
    const { data: updatedData, error: updateError } = await supabase
      .from("users")
      .update(profileData)
      .eq("id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ [updateUserProfile] Error updating data:", updateError)

      // RLSエラーの場合は、RPC関数を試行
      if (updateError.code === "42501" || updateError.message?.includes("RLS")) {
        console.log("🔧 [updateUserProfile] RLS error detected, trying RPC function")
        return await updateViaRPC(userId, profileData)
      }

      throw updateError
    }

    console.log("✅ [updateUserProfile] Data updated successfully:", updatedData)
    return updatedData
  } catch (error) {
    console.error("❌ [updateUserProfile] Standard update failed:", error)

    // 3. RPC関数による更新を試行
    console.log("🔧 [updateUserProfile] Trying RPC function as fallback")
    try {
      return await updateViaRPC(userId, profileData)
    } catch (rpcError) {
      console.error("❌ [updateUserProfile] RPC update also failed:", rpcError)

      // 4. サーバーサイドAPIによる更新を試行
      console.log("🔧 [updateUserProfile] Trying server-side API as final fallback")
      return await updateViaAPI(userId, profileData)
    }
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

  const supabase = createFreshClient()

  const { data, error } = await supabase.rpc("admin_update_user_profile", {
    target_user_id: userId,
    profile_updates: profileData,
  })

  if (error) {
    console.error("❌ [updateViaRPC] RPC error:", error)
    throw error
  }

  console.log("✅ [updateViaRPC] RPC update successful:", data)
  return data
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

  if (!response.ok) {
    const errorText = await response.text()
    console.error("❌ [updateViaAPI] API error:", errorText)
    throw new Error(`API update failed: ${errorText}`)
  }

  const result = await response.json()
  console.log("✅ [updateViaAPI] API update successful:", result)
  return result.data
}
