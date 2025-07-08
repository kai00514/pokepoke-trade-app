import { createBrowserClient } from "@supabase/ssr"

// シングルトンインスタンスを作成
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// 後方互換性のためのcreateClient関数も提供
export function createClient() {
  return supabase
}
