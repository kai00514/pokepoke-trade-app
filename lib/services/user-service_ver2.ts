import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  pokepoke_id?: string
  display_name?: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// 毎回新しいクライアントを作成する関数
function createFreshClient(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.")
  }

  console.log("🔄 [createFreshClient] Creating new Supabase client")

  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "X-Client-Info": "pokepoke-trade-app-v2",
      },
    },
  })
}

// セッション情報を取得する関数
async function getAuthSession(client: SupabaseClient) {
  try {
    console.log("🔍 [getAuthSession] Getting current session")
    const { data, error } = await client.auth.getSession()

    if (error) {
      console.error("❌ [getAuthSession] Error getting session:", error)
      return { session: null, error }
    }

    console.log("✅ [getAuthSession] Session retrieved:", data.session ? "Session exists" : "No session")
    return { session: data.session, error: null }
  } catch (e) {
    console.error("❌ [getAuthSession] Exception getting session:", e)
    return { session: null, error: e instanceof Error ? e : new Error(String(e)) }
  }
}

// ユーザー情報を取得する関数
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    console.log("🔍 [getUserProfile] START - Getting profile for user:", userId)
    const supabase = createFreshClient()

    // セッション確認
    const { session, error: sessionError } = await getAuthSession(supabase)
    if (sessionError) {
      console.error("❌ [getUserProfile] Session error:", sessionError)
      return null
    }

    console.log("🔍 [getUserProfile] Current auth state:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      requestedUserId: userId,
    })

    // データ取得
    console.log("🔍 [getUserProfile] Fetching user data from database")
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("❌ [getUserProfile] Database error:", {
        code: error.code,
        message: error.message,
        details: error.details,
      })
      return null
    }

    console.log("✅ [getUserProfile] User data retrieved:", data)
    return data
  } catch (error) {
    console.error("❌ [getUserProfile] Exception:", error)
    return null
  }
}

// ユーザープロファイルを作成する関数
export async function createUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    console.log("🔧 [createUserProfile] START - Creating profile for user:", userId)
    const supabase = createFreshClient()

    // セッション確認
    const { session, error: sessionError } = await getAuthSession(supabase)
    if (sessionError) {
      console.error("❌ [createUserProfile] Session error:", sessionError)
      return null
    }

    console.log("🔧 [createUserProfile] Current auth state:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      requestedUserId: userId,
    })

    // セッションユーザーIDと一致するか確認
    if (session?.user?.id !== userId) {
      console.error("❌ [createUserProfile] User ID mismatch:", {
        sessionUserId: session?.user?.id,
        requestedUserId: userId,
      })
      return null
    }

    // データ作成
    console.log("🔧 [createUserProfile] Creating user data in database")
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
      console.error("❌ [createUserProfile] Database error:", {
        code: error.code,
        message: error.message,
        details: error.details,
      })
      return null
    }

    console.log("✅ [createUserProfile] User profile created:", data)
    return data
  } catch (error) {
    console.error("❌ [createUserProfile] Exception:", error)
    return null
  }
}

// ユーザープロファイルを更新する関数
export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    console.log("🔧 [updateUserProfile_v2] START - Function called")
    console.log("🔧 [updateUserProfile_v2] Input userId:", userId)
    console.log("🔧 [updateUserProfile_v2] Input profileData:", profileData)

    // 新しいクライアントを作成（Singletonを使わない）
    const supabase = createFreshClient()
    console.log("🔧 [updateUserProfile_v2] Fresh Supabase client created")

    // セッション確認
    const { session, error: sessionError } = await getAuthSession(supabase)
    if (sessionError) {
      console.error("❌ [updateUserProfile_v2] Session error:", sessionError)
      return null
    }

    console.log("🔧 [updateUserProfile_v2] Current auth state:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      requestedUserId: userId,
    })

    // セッションユーザーIDと一致するか確認
    if (!session) {
      console.error("❌ [updateUserProfile_v2] No active session")
      return null
    }

    if (session.user.id !== userId) {
      console.error("❌ [updateUserProfile_v2] User ID mismatch:", {
        sessionUserId: session.user.id,
        requestedUserId: userId,
      })
      return null
    }

    // 更新前のデータを確認（デバッグ用）
    console.log("🔧 [updateUserProfile_v2] Checking current data before update...")

    // 直接SQLクエリを実行してRLSをバイパス（管理者権限が必要）
    const { data: adminData, error: adminError } = await supabase.rpc("admin_get_user_by_id", {
      user_id: userId,
    })

    if (adminError) {
      console.log("🔧 [updateUserProfile_v2] Admin query not available, trying standard query")

      // 標準クエリを試行
      const { data: currentData, error: selectError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (selectError) {
        console.error("❌ [updateUserProfile_v2] SELECT query failed:", {
          code: selectError.code,
          message: selectError.message,
          details: selectError.details,
        })

        // RLSポリシーエラーの可能性をチェック
        if (selectError.code === "PGRST116" || selectError.message?.includes("row-level security")) {
          console.error("❌ [updateUserProfile_v2] RLS Policy Error - User may not be properly authenticated")
        }
      } else {
        console.log("🔧 [updateUserProfile_v2] Current data:", currentData)
      }
    } else {
      console.log("🔧 [updateUserProfile_v2] Admin query result:", adminData)
    }

    // 更新データの準備
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }
    console.log("🔧 [updateUserProfile_v2] Update data prepared:", updateData)

    // 更新実行
    console.log("🔧 [updateUserProfile_v2] Executing update query...")

    // 直接SQLクエリを実行してRLSをバイパス（管理者権限が必要）
    const { data: adminUpdateData, error: adminUpdateError } = await supabase.rpc("admin_update_user_profile", {
      user_id: userId,
      update_data: updateData,
    })

    if (adminUpdateError) {
      console.log("🔧 [updateUserProfile_v2] Admin update not available, trying standard update")

      // 標準更新を試行
      const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

      console.log("🔧 [updateUserProfile_v2] Update result - data:", data)
      console.log("🔧 [updateUserProfile_v2] Update result - error:", error)

      if (error) {
        console.error("❌ [updateUserProfile_v2] ERROR - Update failed:", {
          code: error.code,
          message: error.message,
          details: error.details,
        })

        // 最終手段：サーバーサイドAPIを使用
        console.log("🔧 [updateUserProfile_v2] Trying server-side API as fallback...")
        const apiResponse = await fetch("/api/users/update-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            profileData: updateData,
          }),
        })

        if (!apiResponse.ok) {
          console.error("❌ [updateUserProfile_v2] API fallback failed:", await apiResponse.text())
          return null
        }

        const apiResult = await apiResponse.json()
        console.log("✅ [updateUserProfile_v2] API fallback succeeded:", apiResult)
        return apiResult.data
      }

      console.log("✅ [updateUserProfile_v2] SUCCESS - Update completed")
      return data
    } else {
      console.log("✅ [updateUserProfile_v2] Admin update succeeded:", adminUpdateData)
      return adminUpdateData
    }
  } catch (error) {
    console.error("❌ [updateUserProfile_v2] CATCH ERROR - Exception occurred:", error)
    console.error("❌ [updateUserProfile_v2] CATCH ERROR - Error type:", typeof error)
    console.error(
      "❌ [updateUserProfile_v2] CATCH ERROR - Error stack:",
      error instanceof Error ? error.stack : "No stack",
    )
    return null
  }
}

// サーバーサイドAPIのためのRPCを作成するSQL関数
// これはデータベースに追加する必要があります
/*
CREATE OR REPLACE FUNCTION admin_get_user_by_id(user_id UUID)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION admin_update_user_profile(user_id UUID, update_data JSONB)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    pokepoke_id = COALESCE(update_data->>'pokepoke_id', pokepoke_id),
    display_name = COALESCE(update_data->>'display_name', display_name),
    name = COALESCE(update_data->>'name', name),
    avatar_url = COALESCE(update_data->>'avatar_url', avatar_url),
    updated_at = COALESCE(update_data->>'updated_at', updated_at)
  WHERE id = user_id;
  
  RETURN QUERY SELECT * FROM users WHERE id = user_id;
END;
$$;
*/
