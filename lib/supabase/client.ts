import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Singleton pattern for the client-side Supabase client
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

// 互換性のための名前付きエクスポート (他のファイルが createBrowserClient としてインポートしている場合)
export { createClient as createBrowserClient }
// supabase インスタンスを名前付きエクスポートとして提供 (他のファイルが supabase としてインポートしている場合)
export const supabase = createClient()
// デフォルトエクスポート (他のファイルがデフォルトインポートしている場合)
export default createClient
