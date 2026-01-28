import { supabase } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/user"

const CACHE_KEY_PREFIX = "user_profile_"
const CACHE_TTL = 60 * 60 * 1000 // 60分

type CachedProfile = Pick<UserProfile, "id" | "display_name" | "avatar_url" | "updated_at"> & {
  cachedAt: number
}

// 進行中のリクエストを追跡
const ongoingRequests = new Map<string, Promise<UserProfile | null>>()

// キャッシュ専用の同期関数
function getCachedProfileSync(userId: string): UserProfile | null {
  if (typeof window === "undefined") return null

  try {
    const cachedItem = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`)
    if (!cachedItem) return null

    const profile = JSON.parse(cachedItem) as CachedProfile
    if (Date.now() - profile.cachedAt > CACHE_TTL) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`)
      return null
    }

    // UserProfile型に合わせるため、不足しているプロパティを補う
    return {
      ...profile,
      name: profile.display_name,
      pokepoke_id: null,
      created_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Failed to get cached profile:", error)
    return null
  }
}

function setCachedProfile(profile: UserProfile) {
  if (typeof window === "undefined") return

  try {
    const cachedData: CachedProfile = {
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      updated_at: profile.updated_at,
      cachedAt: Date.now(),
    }
    localStorage.setItem(`${CACHE_KEY_PREFIX}${profile.id}`, JSON.stringify(cachedData))
  } catch (error) {
    console.error("Failed to cache user profile:", error)
  }
}

export function clearCachedProfile(userId: string) {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`)
    // 進行中のリクエストもクリア
    ongoingRequests.delete(userId)
  } catch (error) {
    console.error("Failed to clear user profile cache:", error)
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, abortController?: AbortController): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (abortController) {
        abortController.abort()
      }
      reject(new Error(`Promise timed out after ${ms} ms`))
    }, ms)

    promise.then(resolve, reject).finally(() => clearTimeout(timeoutId))
  })
}

async function fetchUserProfileWithRetry(userId: string, maxRetries = 2): Promise<UserProfile | null> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const abortController = new AbortController()

    try {
      console.log(`🔄 Fetching user profile attempt ${attempt + 1}/${maxRetries} for user: ${userId}`)

      // 標準的なSupabaseクエリのみを使用
      const { data, error } = await withTimeout(
        supabase.from("users").select("*").eq("id", userId).single().abortSignal(abortController.signal),
        5000, // 5秒タイムアウト（余裕を持たせる）
        abortController,
      )

      console.log("📊 Standard query result:", {
        data: !!data,
        error: error?.message,
        code: error?.code,
      })

      if (error) {
        if (error.code === "PGRST116") {
          // 行が見つからないエラー - これは正常なケース
          console.log("ℹ️ No user profile found in database")
          return null
        }

        console.error(`❌ Supabase error (attempt ${attempt + 1}):`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        })
        throw error
      }

      if (data) {
        console.log("✅ Profile fetched successfully:", { id: data.id, display_name: data.display_name })
        setCachedProfile(data)
        return data
      }

      console.log("���️ No user profile found in database")
      return null
    } catch (error) {
      lastError = error as Error
      console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error)

      // 最後の試行でない場合は少し待つ
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))) // 1秒, 2秒と増加
      }
    }
  }

  console.error("❌ All retries failed for getUserProfile")
  throw lastError || new Error("Unknown error occurred")
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.warn("⚠️ getUserProfile called with empty userId")
    return null
  }

  // 進行中のリクエストがある場合はそれを返す
  if (ongoingRequests.has(userId)) {
    console.log("🔄 Returning ongoing request for user:", userId)
    return ongoingRequests.get(userId)!
  }

  // まずキャッシュを確認
  const cachedProfile = getCachedProfileSync(userId)
  if (cachedProfile) {
    console.log("💾 Returning cached profile for user:", userId)
    return cachedProfile
  }

  // 新しいリクエストを開始
  console.log("🚀 Starting new profile fetch for user:", userId)
  const request = fetchUserProfileWithRetry(userId)
  ongoingRequests.set(userId, request)

  try {
    const result = await request
    return result
  } finally {
    // リクエスト完了後にクリア
    ongoingRequests.delete(userId)
  }
}

export async function createUserProfile(userId: string, email: string, avatarUrl?: string): Promise<UserProfile> {
  console.log("🆕 Creating new user profile:", { userId, email, avatarUrl })

  const displayName = email.split("@")[0]
  const { data, error } = await supabase
    .from("users")
    .insert({ 
      id: userId, 
      display_name: displayName, 
      name: displayName,
      avatar_url: avatarUrl || null
    })
    .select()
    .single()

  if (error) {
    console.error("❌ Failed to create user profile:", error)
    throw error
  }

  console.log("✅ User profile created successfully:", data)
  setCachedProfile(data)
  return data
}

export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
  console.log("📝 Updating user profile:", { userId, profileData })

  const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

  if (error) {
    console.error("❌ Failed to update user profile:", error)
    throw error
  }

  console.log("✅ User profile updated successfully:", data)
  setCachedProfile(data)
  return data
}

// フォールバック用のプロファイル生成
export function createFallbackProfile(user: { id: string; email?: string }): UserProfile {
  return {
    id: user.id,
    display_name: user.email?.split("@")[0] || "ユーザー",
    name: user.email?.split("@")[0] || "ユーザー",
    avatar_url: null,
    pokepoke_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
