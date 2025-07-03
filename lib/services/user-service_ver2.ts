import { createClient } from "@/lib/supabase/client"

// ユーザープロファイル更新用の型定義
interface UserProfileUpdate {
  pokepoke_id?: string
  display_name?: string
  name?: string
  avatar_url?: string
}

// 認証セッション取得関数
async function getAuthSession() {
  console.log("🔧 [getAuthSession] ===== Getting current auth session =====")

  try {
    const supabase = createClient()
    console.log("🔧 [getAuthSession] Supabase client obtained from createClient()")

    // セッション取得の詳細ログ
    console.log("🔧 [getAuthSession] About to call supabase.auth.getSession()")
    const sessionStartTime = Date.now()

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const sessionEndTime = Date.now()

    console.log("🔧 [getAuthSession] supabase.auth.getSession() completed:", {
      duration: `${sessionEndTime - sessionStartTime}ms`,
      hasSessionData: !!sessionData,
      hasSession: !!sessionData?.session,
      hasUser: !!sessionData?.session?.user,
      sessionError: sessionError,
    })

    if (sessionError) {
      console.error("❌ [getAuthSession] Session error:", sessionError)
      throw new Error(`セッション取得エラー: ${sessionError.message}`)
    }

    if (!sessionData?.session) {
      console.error("❌ [getAuthSession] No session found")
      throw new Error("認証されていません。再度ログインしてください。")
    }

    if (!sessionData.session.user) {
      console.error("❌ [getAuthSession] No user in session")
      throw new Error("ユーザー情報が見つかりません。再度ログインしてください。")
    }

    console.log("✅ [getAuthSession] Session retrieved successfully:", {
      userId: sessionData.session.user.id,
      userEmail: sessionData.session.user.email,
      userRole: sessionData.session.user.role,
      sessionExpiry: sessionData.session.expires_at,
    })

    return sessionData.session
  } catch (error) {
    console.error("❌ [getAuthSession] CATCH ERROR:", error)
    throw error
  }
}

// ユーザープロファイル更新関数（RPC使用）
export async function updateUserProfile(userId: string, profileData: UserProfileUpdate) {
  console.log("🔧 [updateUserProfile] ===== START - Using RPC =====")
  console.log("🔧 [updateUserProfile] Input userId:", userId)
  console.log("🔧 [updateUserProfile] Input profileData:", profileData)
  console.log("🔧 [updateUserProfile] Timestamp:", new Date().toISOString())

  try {
    // 認証セッション確認
    const session = await getAuthSession()
    console.log("🔧 [updateUserProfile] Auth session confirmed:", {
      sessionUserId: session.user.id,
      inputUserId: userId,
      userMatch: session.user.id === userId,
    })

    if (session.user.id !== userId) {
      console.error("❌ [updateUserProfile] User ID mismatch")
      throw new Error("ユーザーIDが一致しません。")
    }

    // Supabaseクライアント取得
    const supabase = createClient()
    console.log("🔧 [updateUserProfile] Supabase client obtained")

    // RLS ポリシーテスト - SELECT権限確認
    console.log("🔧 [updateUserProfile] Testing RLS SELECT policy...")
    const selectStartTime = Date.now()
    const { data: selectData, error: selectError } = await supabase.from("users").select("*").eq("id", userId).single()
    const selectEndTime = Date.now()

    console.log("🔧 [updateUserProfile] RLS SELECT test result:", {
      duration: `${selectEndTime - selectStartTime}ms`,
      hasData: !!selectData,
      selectError: selectError,
      canReadOwnData: !selectError && !!selectData,
    })

    // RLS ポリシーテスト - UPDATE権限確認（テスト用の軽微な更新）
    console.log("🔧 [updateUserProfile] Testing RLS UPDATE policy...")
    const updateTestStartTime = Date.now()
    const { data: updateTestData, error: updateTestError } = await supabase
      .from("users")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
    const updateTestEndTime = Date.now()

    console.log("🔧 [updateUserProfile] RLS UPDATE test result:", {
      duration: `${updateTestEndTime - updateTestStartTime}ms`,
      hasData: !!updateTestData,
      updateTestError: updateTestError,
      canUpdateOwnData: !updateTestError && !!updateTestData,
    })

    // RLS policy test summary
    console.log("🔧 [updateUserProfile] RLS policy test summary:", {
      canSelect: !selectError,
      canUpdate: !updateTestError,
      readyForRPC: !selectError && !updateTestError,
    })

    // RPC関数呼び出し
    console.log("🔧 [updateUserProfile] Calling RPC function: admin_update_user_profile")
    const rpcStartTime = Date.now()

    const { data: rpcData, error: rpcError } = await supabase.rpc("admin_update_user_profile", {
      p_user_id: userId,
      p_update_data: profileData,
    })

    const rpcEndTime = Date.now()

    console.log("🔧 [updateUserProfile] RPC function completed:", {
      duration: `${rpcEndTime - rpcStartTime}ms`,
      hasData: !!rpcData,
      dataLength: Array.isArray(rpcData) ? rpcData.length : "not-array",
      rpcError: rpcError,
    })

    if (rpcError) {
      console.error("❌ [updateUserProfile] RPC error:", rpcError)
      throw new Error(`プロファイル更新エラー: ${rpcError.message}`)
    }

    if (!rpcData || (Array.isArray(rpcData) && rpcData.length === 0)) {
      console.error("❌ [updateUserProfile] No data returned from RPC")
      throw new Error("プロファイルの更新に失敗しました。データが返されませんでした。")
    }

    const updatedProfile = Array.isArray(rpcData) ? rpcData[0] : rpcData
    console.log("✅ [updateUserProfile] Profile updated successfully:", updatedProfile)

    return updatedProfile
  } catch (error) {
    console.error("❌ [updateUserProfile] CATCH ERROR:", error)
    throw error
  }
}
