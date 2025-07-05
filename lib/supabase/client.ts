import { createBrowserClient as _createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let supabaseInstance: SupabaseClient | null = null

/**
 * Supabaseクライアントのシングルトンインスタンスを作成または取得します。
 * これにより、アプリケーション全体で同じクライアントインスタンスが再利用されます。
 */
export function createClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabaseの環境変数が設定されていません。")
    }

    supabaseInstance = _createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  }
  return supabaseInstance
}

// アプリケーション全体で使用するグローバルなSupabaseクライアントインスタンス
export const supabase = createClient()
