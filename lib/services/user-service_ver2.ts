import { createClient } from "@/lib/supabase/client"

// Supabaseクライアントのシングルトンインスタンス
let supabaseInstance: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient()
  }
  return supabaseInstance
}

// 認証セッションを取得する関数
async function getAuthSession() {
  console.log("🔧 [getAuthSession] Getting current auth session")

  try {
    const supabase = getSupabaseClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log("🔧 [getAuthSession] Session result:", {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionError: sessionError?.message,
    })

    if (sessionError) {
      console.error("❌ [getAuthSession] Session error:", sessionError)
      throw sessionError
    }

    if (!session) {
      console.error("❌ [getAuthSession] No active session found")
      throw new Error("認証セッションが見つかりません")
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("🔧 [getAuthSession] User result:", {
      hasUser: !!user,
      userId: user?.id,
      userError: userError?.message,
    })

    if (userError) {
      console.error("❌ [getAuthSession] User error:", userError)
      throw userError
    }

    if (!user) {
      console.error("❌ [getAuthSession] No authenticated user found")
      throw new Error("認証されたユーザーが見つかりません")
    }

    return { session, user }
  } catch (error) {
    console.error("❌ [getAuthSession] Exception:", error)
    throw error
  }
}

// サーバーサイドAPIを使用してユーザープロファイルを更新
async function updateViaAPI(userId: string, profileData: any) {
  console.log("🌐 [updateViaAPI] Using server-side API")

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

    console.log("🌐 [updateViaAPI] API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ [updateViaAPI] API error response:", errorText)
      throw new Error(`API request failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log("✅ [updateViaAPI] API success:", result)

    return result.user
  } catch (error) {
    console.error("❌ [updateViaAPI] Exception:", error)
    throw error
  }
}

// RPC関数を使用してユーザープロファイルを更新
async function updateViaRPC(userId: string, profileData: any) {
  console.log("🔧 [updateViaRPC] Using RPC function")

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.rpc("admin_update_user_profile", {
      target_user_id: userId,
      profile_data: profileData,
    })

    console.log("🔧 [updateViaRPC] RPC result:", { data, error })

    if (error) {
      console.error("❌ [updateViaRPC] RPC error:", error)
      throw error
    }

    if (!data) {
      console.error("❌ [updateViaRPC] No data returned from RPC")
      throw new Error("RPC関数からデータが返されませんでした")
    }

    console.log("✅ [updateViaRPC] RPC success:", data)
    return data
  } catch (error) {
    console.error("❌ [updateViaRPC] Exception:", error)
    throw error
  }
}

// 標準的なSupabaseクエリを使用してユーザープロファイルを更新
async function updateViaStandardQuery(userId: string, profileData: any) {
  console.log("🔧 [updateViaStandardQuery] Using standard Supabase query")

  try {
    const { session, user } = await getAuthSession()

    // ユーザーIDの一致を確認
    if (user.id !== userId) {
      console.error("❌ [updateViaStandardQuery] User ID mismatch:", {
        sessionUserId: user.id,
        requestedUserId: userId,
      })
      throw new Error("ユーザーIDが一致しません")
    }

    const supabase = getSupabaseClient()

    // まず現在のデータを取得
    console.log("🔧 [updateViaStandardQuery] Fetching current user data...")
    const { data: currentData, error: selectError } = await supabase.from("users").select("*").eq("id", userId).single()

    console.log("🔧 [updateViaStandardQuery] Current data result:", {
      data: currentData,
      error: selectError?.message,
    })

    if (selectError && selectError.code !== "PGRST116") {
      console.error("❌ [updateViaStandardQuery] Select error:", selectError)
      throw selectError
    }

    // データが存在しない場合は作成
    if (!currentData) {
      console.log("🔧 [updateViaStandardQuery] Creating new user record...")
      const { data: insertData, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: user.email,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      console.log("🔧 [updateViaStandardQuery] Insert result:", {
        data: insertData,
        error: insertError?.message,
      })

      if (insertError) {
        console.error("❌ [updateViaStandardQuery] Insert error:", insertError)
        throw insertError
      }

      console.log("✅ [updateViaStandardQuery] User created successfully:", insertData)
      return insertData
    } else {
      // データが存在する場合は更新
      console.log("🔧 [updateViaStandardQuery] Updating existing user record...")
      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      console.log("🔧 [updateViaStandardQuery] Update result:", {
        data: updateData,
        error: updateError?.message,
      })

      if (updateError) {
        console.error("❌ [updateViaStandardQuery] Update error:", updateError)
        throw updateError
      }

      console.log("✅ [updateViaStandardQuery] User updated successfully:", updateData)
      return updateData
    }
  } catch (error) {
    console.error("❌ [updateViaStandardQuery] Exception:", error)
    throw error
  }
}

// メイン関数：複数の方法を試行してユーザープロファイルを更新
export async function updateUserProfile(userId: string, profileData: any) {
  console.log("🔧 [updateUserProfile] START - Function called")
  console.log("🔧 [updateUserProfile] Input userId:", userId)
  console.log("🔧 [updateUserProfile] Input profileData:", profileData)

  if (!userId) {
    console.error("❌ [updateUserProfile] Invalid userId:", userId)
    throw new Error("ユーザーIDが無効です")
  }

  if (!profileData || Object.keys(profileData).length === 0) {
    console.error("❌ [updateUserProfile] Invalid profileData:", profileData)
    throw new Error("更新するプロファイルデータが無効です")
  }

  const methods = [
    { name: "Server API", fn: updateViaAPI },
    { name: "RPC Function", fn: updateViaRPC },
    { name: "Standard Query", fn: updateViaStandardQuery },
  ]

  for (const method of methods) {
    try {
      console.log(`🔄 [updateUserProfile] Trying method: ${method.name}`)
      const result = await method.fn(userId, profileData)
      console.log(`✅ [updateUserProfile] Success with ${method.name}:`, result)
      return result
    } catch (error) {
      console.error(`❌ [updateUserProfile] ${method.name} failed:`, error)

      // 最後の方法でも失敗した場合はエラーを投げる
      if (method === methods[methods.length - 1]) {
        console.error("❌ [updateUserProfile] All methods failed")
        throw error
      }

      // 次の方法を試行
      console.log(`🔄 [updateUserProfile] Trying next method...`)
    }
  }

  console.log("🔧 [updateUserProfile] END")
}

// 現在のユーザー情報を取得する関数
export async function getCurrentUser() {
  try {
    const { user } = await getAuthSession()
    return user
  } catch (error) {
    console.error("❌ [getCurrentUser] Error:", error)
    return null
  }
}

// ユーザープロファイルを取得する関数
export async function getUserProfile(userId: string) {
  console.log("🔧 [getUserProfile] Getting user profile for:", userId)

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    console.log("🔧 [getUserProfile] Result:", { data, error })

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return data
  } catch (error) {
    console.error("❌ [getUserProfile] Error:", error)
    throw error
  }
}
