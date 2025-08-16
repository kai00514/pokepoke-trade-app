import { createBrowserClient } from "@supabase/ssr"

// 環境変数の存在チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables")
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables")
}

console.log("=== DEBUG: Creating Supabase client ===")
console.log("URL:", supabaseUrl)
console.log("Key:", supabaseAnonKey ? "present" : "missing")

// シングルトンインスタンスを作成
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// 後方互換性のためのcreateClient関数も提供
export function createClient() {
  return supabase
}
