import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Singleton pattern to manage the client instance
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

    // クライアント作成時の初期状態をログ
    console.log("🔧 [getSupabaseClient] Client created with config:", {
      url: supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
    })
  } else {
    console.log("🔧 [getSupabaseClient] Using existing Supabase client instance")
  }
  return supabaseInstance
}

async function getAuthSession() {
  console.log("🔧 [getAuthSession] ===== Getting current auth session =====")
  const supabase = getSupabaseClient()
  try {
    const startTime = Date.now()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    const endTime = Date.now()

    // 詳細な認証状態デバッグ
    console.log("🔍 [getAuthSession] Session retrieval timing:", {
      duration: `${endTime - startTime}ms`,
      timestamp: new Date().toISOString(),
    })

    console.log("🔍 [getAuthSession] Session details:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role || "NO_ROLE",
      userAud: session?.user?.aud || "NO_AUD",
      accessToken: session?.access_token ? `EXISTS (${session.access_token.substring(0, 20)}...)` : "MISSING",
      refreshToken: session?.refresh_token ? `EXISTS (${session.refresh_token.substring(0, 20)}...)` : "MISSING",
      tokenType: session?.token_type || "NO_TOKEN_TYPE",
      expiresAt: session?.expires_at,
      expiresAtDate: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : "NO_EXPIRY",
      currentTime: Math.floor(Date.now() / 1000),
      currentTimeDate: new Date().toISOString(),
      isExpired: session?.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : "UNKNOWN",
      timeUntilExpiry: session?.expires_at ? `${session.expires_at - Math.floor(Date.now() / 1000)}s` : "UNKNOWN",
    })

    // ユーザーメタデータの詳細
    if (session?.user) {
      console.log("🔍 [getAuthSession] User metadata:", {
        userMetadata: session.user.user_metadata,
        appMetadata: session.user.app_metadata,
        identities: session.user.identities?.map((id) => ({
          provider: id.provider,
          id: id.id,
          created_at: id.created_at,
        })),
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at,
        emailConfirmedAt: session.user.email_confirmed_at,
      })
    }

    if (error) {
      console.error("❌ [getAuthSession] Session error details:", {
        code: error.code,
        message: error.message,
        status: error.status,
        details: error.details,
        hint: error.hint,
        fullError: error,
      })
      throw error
    }
    console.log("✅ [getAuthSession] Session retrieved successfully.")
    return session
  } catch (error) {
    console.error("❌ [getAuthSession] Failed to get session:", error)
    throw error
  }
}

// 認証状態の詳細確認関数
async function debugAuthState(supabase: SupabaseClient, context: string) {
  console.log(`🔍 [debugAuthState] ===== ${context} =====`)

  try {
    // 1. getUser() での認証状態確認
    const userStartTime = Date.now()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    const userEndTime = Date.now()

    console.log(`🔍 [debugAuthState] ${context} - getUser() result:`, {
      duration: `${userEndTime - userStartTime}ms`,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role || "NO_ROLE",
      userAud: user?.aud || "NO_AUD",
      error: userError
        ? {
            code: userError.code,
            message: userError.message,
            status: userError.status,
          }
        : null,
    })

    // 2. getSession() での認証状態確認
    const sessionStartTime = Date.now()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    const sessionEndTime = Date.now()

    console.log(`🔍 [debugAuthState] ${context} - getSession() result:`, {
      duration: `${sessionEndTime - sessionStartTime}ms`,
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      sessionUserEmail: session?.user?.email,
      sessionUserRole: session?.user?.role || "NO_ROLE",
      accessToken: session?.access_token ? `EXISTS (${session.access_token.substring(0, 20)}...)` : "MISSING",
      isExpired: session?.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : "UNKNOWN",
      error: sessionError
        ? {
            code: sessionError.code,
            message: sessionError.message,
            status: sessionError.status,
          }
        : null,
    })

    // 3. セッション同期確認
    const userSessionMatch = user?.id === session?.user?.id
    console.log(`🔍 [debugAuthState] ${context} - Session sync check:`, {
      userSessionMatch,
      getUserId: user?.id,
      getSessionUserId: session?.user?.id,
      bothExist: !!user && !!session?.user,
      neitherExist: !user && !session?.user,
    })

    return {
      user,
      session,
      userError,
      sessionError,
      userSessionMatch,
    }
  } catch (error) {
    console.error(`❌ [debugAuthState] ${context} - Error during auth state debug:`, error)
    return {
      user: null,
      session: null,
      userError: error,
      sessionError: error,
      userSessionMatch: false,
    }
  }
}

// RLS ポリシーテスト関数
async function testRLSPolicies(supabase: SupabaseClient, userId: string) {
  console.log("🔍 [testRLSPolicies] ===== Testing RLS Policies =====")

  try {
    // 1. SELECT テスト (自分のデータを読み取れるか)
    console.log("🔍 [testRLSPolicies] Testing SELECT policy...")
    const selectStartTime = Date.now()
    const { data: selectData, error: selectError } = await supabase.from("users").select("*").eq("id", userId).single()
    const selectEndTime = Date.now()

    console.log("🔍 [testRLSPolicies] SELECT test result:", {
      duration: `${selectEndTime - selectStartTime}ms`,
      hasData: !!selectData,
      dataId: selectData?.id,
      dataPokepokeId: selectData?.pokepoke_id,
      dataDisplayName: selectData?.display_name,
      error: selectError
        ? {
            code: selectError.code,
            message: selectError.message,
            details: selectError.details,
            hint: selectError.hint,
          }
        : null,
    })

    // 2. UPDATE テスト (自分のデータを更新できるか)
    console.log("🔍 [testRLSPolicies] Testing UPDATE policy...")
    const updateStartTime = Date.now()
    const testUpdateData = { updated_at: new Date().toISOString() }
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update(testUpdateData)
      .eq("id", userId)
      .select()
    const updateEndTime = Date.now()

    console.log("🔍 [testRLSPolicies] UPDATE test result:", {
      duration: `${updateEndTime - updateStartTime}ms`,
      hasData: !!updateData,
      dataLength: Array.isArray(updateData) ? updateData.length : "N/A",
      error: updateError
        ? {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
          }
        : null,
    })

    return {
      selectSuccess: !selectError && !!selectData,
      updateSuccess: !updateError && !!updateData,
      selectError,
      updateError,
    }
  } catch (error) {
    console.error("❌ [testRLSPolicies] Error during RLS policy test:", error)
    return {
      selectSuccess: false,
      updateSuccess: false,
      selectError: error,
      updateError: error,
    }
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
  console.log("🔧 [updateUserProfile] ===== START - Using RPC =====")
  console.log("🔧 [updateUserProfile] Input userId:", userId)
  console.log("🔧 [updateUserProfile] Input profileData:", profileData)
  console.log("🔧 [updateUserProfile] Timestamp:", new Date().toISOString())

  try {
    // セッション認証確認
    const session = await getAuthSession()
    if (!session || !session.user) {
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

    const supabase = getSupabaseClient()

    // 認証状態の詳細確認
    const preRpcAuthState = await debugAuthState(supabase, "Pre-RPC")

    // RLS ポリシーのテスト
    const rlsTestResult = await testRLSPolicies(supabase, userId)
    console.log("🔍 [updateUserProfile] RLS policy test summary:", {
      selectSuccess: rlsTestResult.selectSuccess,
      updateSuccess: rlsTestResult.updateSuccess,
      hasSelectError: !!rlsTestResult.selectError,
      hasUpdateError: !!rlsTestResult.updateError,
    })

    // RPC呼び出し実行
    console.log("🚀 [updateUserProfile] Calling RPC function...")
    console.log("🚀 [updateUserProfile] RPC parameters:", {
      functionName: "admin_update_user_profile",
      p_user_id: userId,
      p_update_data: profileData,
    })

    const rpcStartTime = Date.now()
    const { data, error } = await supabase.rpc("admin_update_user_profile", {
      p_user_id: userId,
      p_update_data: profileData,
    })
    const rpcEndTime = Date.now()

    // RPC呼び出し結果の詳細ログ
    console.log("🔍 [updateUserProfile] RPC call timing:", {
      duration: `${rpcEndTime - rpcStartTime}ms`,
      startTime: new Date(rpcStartTime).toISOString(),
      endTime: new Date(rpcEndTime).toISOString(),
    })

    console.log("🔍 [updateUserProfile] RPC call result:", {
      hasData: !!data,
      dataType: Array.isArray(data) ? "array" : typeof data,
      dataLength: Array.isArray(data) ? data.length : "N/A",
      dataContent: data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
    })

    // RPC呼び出し後の認証状態確認
    const postRpcAuthState = await debugAuthState(supabase, "Post-RPC")

    // 認証状態の変化確認
    console.log("🔍 [updateUserProfile] Auth state comparison:", {
      preRpcHasUser: !!preRpcAuthState.user,
      postRpcHasUser: !!postRpcAuthState.user,
      preRpcHasSession: !!preRpcAuthState.session,
      postRpcHasSession: !!postRpcAuthState.session,
      userIdConsistent: preRpcAuthState.user?.id === postRpcAuthState.user?.id,
      sessionIdConsistent: preRpcAuthState.session?.user?.id === postRpcAuthState.session?.user?.id,
    })

    if (error) {
      console.error("❌ [updateUserProfile] RPC error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: error,
        authStateAtError: {
          hasUser: !!postRpcAuthState.user,
          hasSession: !!postRpcAuthState.session,
          userRole: postRpcAuthState.user?.role,
        },
      })
      throw new Error(`プロファイルの更新に失敗しました: ${error.message}`)
    }

    console.log("✅ [updateUserProfile] RPC update successful:", data)
    const updatedProfile = Array.isArray(data) ? data[0] : data
    if (!updatedProfile) {
      console.error("❌ [updateUserProfile] RPC returned empty result")
      console.error("❌ [updateUserProfile] Debug info:", {
        rawData: data,
        dataType: typeof data,
        isArray: Array.isArray(data),
        arrayLength: Array.isArray(data) ? data.length : "N/A",
      })
      throw new Error("RPC did not return the updated profile.")
    }

    console.log("✅ [updateUserProfile] Final result:", updatedProfile)
    console.log("🔧 [updateUserProfile] ===== END =====")
    return updatedProfile
  } catch (error) {
    console.error("❌ [updateUserProfile] Error in updateUserProfile:", error)
    console.error("❌ [updateUserProfile] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    throw error
  }
}
