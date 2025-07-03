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
  } else {
    console.log("🔧 [getSupabaseClient] Using existing Supabase client instance")
  }
  return supabaseInstance
}

async function getAuthSession() {
  console.log("🔧 [getAuthSession] Getting current auth session")
  const supabase = getSupabaseClient()
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) {
      console.error("❌ [getAuthSession] Session error:", error)
      throw error
    }
    console.log("✅ [getAuthSession] Session retrieved successfully.")
    return session
  } catch (error) {
    console.error("❌ [getAuthSession] Failed to get session:", error)
    throw error
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
  console.log("🔧 [updateUserProfile] START - Using RPC")
  console.log("🔧 [updateUserProfile] Input userId:", userId)
  console.log("🔧 [updateUserProfile] Input profileData:", profileData)

  try {
    const session = await getAuthSession()
    if (!session || !session.user) {
      throw new Error("認証されていません。再度ログインしてください。")
    }
    if (session.user.id !== userId) {
      throw new Error("ユーザーIDが一致しません。")
    }
    console.log("✅ [updateUserProfile] Authentication verified")

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.rpc("admin_update_user_profile", {
      p_user_id: userId,
      p_update_data: profileData,
    })

    if (error) {
      console.error("❌ [updateUserProfile] RPC error:", error)
      // The RPC function now raises a specific error, which will be caught here.
      throw new Error(`プロファイルの更新に失敗しました: ${error.message}`)
    }

    console.log("✅ [updateUserProfile] RPC update successful:", data)
    const updatedProfile = Array.isArray(data) ? data[0] : data
    if (!updatedProfile) {
      // This case should not happen if the RPC function works as expected.
      throw new Error("RPC did not return the updated profile.")
    }
    return updatedProfile
  } catch (error) {
    console.error("❌ [updateUserProfile] Error in updateUserProfile:", error)
    throw error
  }
}
