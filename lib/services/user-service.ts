import { createClient, refreshClientSession, getCurrentUser } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null
  }
}

export async function createUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating user profile:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createUserProfile:", error)
    return null
  }
}

export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    console.log("🔧 [updateUserProfile] START - Function called")
    console.log("🔧 [updateUserProfile] Input userId:", userId)
    console.log("🔧 [updateUserProfile] Input profileData:", profileData)

    const supabase = createClient()
    console.log("🔧 [updateUserProfile] Supabase client created")

    // セッション状態を強制的に更新
    console.log("🔧 [updateUserProfile] Refreshing client session...")
    const { session: refreshedSession, error: refreshError } = await refreshClientSession()

    if (refreshError) {
      console.error("🔧 [updateUserProfile] Session refresh error:", refreshError)
    } else {
      console.log("🔧 [updateUserProfile] Session refresh result:", refreshedSession ? "Session found" : "No session")
    }

    // 現在のユーザー情報を確認
    console.log("🔧 [updateUserProfile] Getting current user...")
    const { user: currentUser, error: userError } = await getCurrentUser()

    if (userError) {
      console.error("🔧 [updateUserProfile] Current user error:", userError)
      return null
    }

    if (!currentUser) {
      console.error("🔧 [updateUserProfile] No current user found")
      return null
    }

    console.log("🔧 [updateUserProfile] Current user:", {
      id: currentUser.id,
      email: currentUser.email,
      matchesUserId: currentUser.id === userId,
    })

    // ユーザーIDの一致を確認
    if (currentUser.id !== userId) {
      console.error("🔧 [updateUserProfile] User ID mismatch:", {
        currentUserId: currentUser.id,
        requestedUserId: userId,
      })
      return null
    }

    // 更新前のデータを確認（デバッグ用）
    console.log("🔧 [updateUserProfile] Checking current data before update...")
    const { data: currentData, error: selectError } = await supabase.from("users").select("*").eq("id", userId).single()

    console.log("🔧 [updateUserProfile] Current data:", currentData)
    console.log("🔧 [updateUserProfile] Select error:", selectError)

    // SELECTクエリが失敗した場合の詳細ログ
    if (selectError) {
      console.error("🔧 [updateUserProfile] SELECT query failed:", {
        code: selectError.code,
        message: selectError.message,
        details: selectError.details,
        hint: selectError.hint,
      })

      // RLSポリシーエラーの可能性をチェック
      if (selectError.code === "PGRST116" || selectError.message?.includes("row-level security")) {
        console.error("🔧 [updateUserProfile] RLS Policy Error - User may not be properly authenticated")

        // セッション情報の詳細確認
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        console.error("🔧 [updateUserProfile] Session check:", {
          hasSession: !!session,
          sessionUserId: session?.user?.id,
          sessionError: sessionError,
        })
      }
    }

    // 更新データの準備
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }
    console.log("🔧 [updateUserProfile] Update data prepared:", updateData)

    // 更新実行
    console.log("🔧 [updateUserProfile] Executing update query...")
    const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

    console.log("🔧 [updateUserProfile] Update result - data:", data)
    console.log("🔧 [updateUserProfile] Update result - error:", error)

    if (error) {
      console.error("🔧 [updateUserProfile] ERROR - Update failed:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return null
    }

    console.log("🔧 [updateUserProfile] SUCCESS - Update completed")
    console.log("🔧 [updateUserProfile] SUCCESS - Returning data:", data)
    return data
  } catch (error) {
    console.error("🔧 [updateUserProfile] CATCH ERROR - Exception occurred:", error)
    console.error("🔧 [updateUserProfile] CATCH ERROR - Error type:", typeof error)
    console.error(
      "🔧 [updateUserProfile] CATCH ERROR - Error stack:",
      error instanceof Error ? error.stack : "No stack",
    )
    return null
  }
}
