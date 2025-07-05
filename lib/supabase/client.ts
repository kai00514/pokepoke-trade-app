import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// グローバルクライアントインスタンス（Singletonパターンを維持しつつ、セッション管理を改善）
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.")
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.")
  }

  if (!supabaseClient) {
    console.log("🔧 [createClient] Creating new Supabase client instance.")
    // createClient関数内でより詳細なログを出力
    try {
      supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            flowType: "pkce",
            // セッション情報の自動更新を有効化
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
          global: {
            headers: {
              "X-Client-Info": "pokepoke-trade-app",
            },
          },
        },
      )
      console.log("✅ [createClient] Supabase client instance created successfully.")
    } catch (e) {
      console.error("❌ [createClient] Error creating Supabase client instance:", e)
      console.error("❌ [createClient] Detailed error info:", {
        error: e,
        errorType: typeof e,
        errorMessage: e instanceof Error ? e.message : String(e),
        errorStack: e instanceof Error ? e.stack : undefined,
        environment: typeof window !== "undefined" ? "browser" : "server",
      })
      throw e
    }
  } else {
    console.log("🔧 [createClient] Using existing Supabase client instance.")
  }
  return supabaseClient
}

// セッション状態を強制的に更新する関数
export async function refreshClientSession() {
  console.log("🔄 [refreshClientSession] Attempting to refresh client session...")
  const supabase = createClient()
  const { data, error } = await supabase.auth.refreshSession()

  if (error) {
    console.error("❌ [refreshClientSession] Error refreshing session:", error)
  } else {
    console.log("✅ [refreshClientSession] Session refreshed successfully")
  }

  return { data, error }
}

// 認証状態を確認する関数
export async function getCurrentUser() {
  console.log("🔍 [getCurrentUser] Attempting to get current user...")
  const client = createClient()
  try {
    const {
      data: { user },
      error,
    } = await client.auth.getUser()
    if (error) {
      console.error("❌ [getCurrentUser] Error getting user:", error)
    } else {
      console.log("✅ [getCurrentUser] User retrieved:", user ? user.id : "No user")
    }
    return { user, error }
  } catch (e) {
    console.error("❌ [getCurrentUser] Unexpected error during getCurrentUser:", e)
    return { user: null, error: e instanceof Error ? e : new Error(String(e)) }
  }
}

// 互換性のための名前付きエクスポート
export { createClient as createBrowserClient }
export const supabase = createClient()
export default createClient
