import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// グローバルクライアントインスタンス（Singletonパターンを維持しつつ、セッション管理を改善）
let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.")
  }

  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
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
  }
  return supabaseInstance
}

// セッション状態を強制的に更新する関数
export async function refreshClientSession() {
  if (supabaseInstance) {
    const {
      data: { session },
      error,
    } = await supabaseInstance.auth.getSession()
    if (error) {
      console.error("❌ Error refreshing client session:", error)
    } else {
      console.log("✅ Client session refreshed:", session ? "Session found" : "No session")
    }
    return { session, error }
  }
  return { session: null, error: new Error("Supabase client not initialized") }
}

// 認証状態を確認する関数
export async function getCurrentUser() {
  const client = createClient()
  const {
    data: { user },
    error,
  } = await client.auth.getUser()
  return { user, error }
}

// 互換性のための名前付きエクスポート
export { createClient as createBrowserClient }
export const supabase = createClient()
export default createClient
