import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// シンプルなクライアント作成関数
export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ [createClient] Missing Supabase environment variables")
    throw new Error("Missing Supabase environment variables")
  }

  console.log("🔧 [createClient] Creating Supabase client")

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

// セッション取得のヘルパー関数（タイムアウト付き）
export async function getSessionWithTimeout(client: SupabaseClient, timeoutMs = 3000) {
  console.log("🔍 [getSessionWithTimeout] Getting session with timeout:", timeoutMs)

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Session timeout")), timeoutMs)
  })

  const sessionPromise = client.auth.getSession()

  try {
    const result = await Promise.race([sessionPromise, timeoutPromise])
    console.log("✅ [getSessionWithTimeout] Session retrieved successfully")
    return result
  } catch (error) {
    console.error("❌ [getSessionWithTimeout] Session timeout or error:", error)
    throw error
  }
}

// ユーザー取得のヘルパー関数（タイムアウト付き）
export async function getUserWithTimeout(client: SupabaseClient, timeoutMs = 3000) {
  console.log("🔍 [getUserWithTimeout] Getting user with timeout:", timeoutMs)

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("User fetch timeout")), timeoutMs)
  })

  const userPromise = client.auth.getUser()

  try {
    const result = await Promise.race([userPromise, timeoutPromise])
    console.log("✅ [getUserWithTimeout] User retrieved successfully")
    return result
  } catch (error) {
    console.error("❌ [getUserWithTimeout] User fetch timeout or error:", error)
    throw error
  }
}

// グローバルインスタンスを作成
export const supabase = createClient()

// 互換性のためのエクスポート
export { createClient as createBrowserClient }
export default createClient
