import { supabase } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/user"

const CACHE_KEY_PREFIX = "user_profile_"
const CACHE_TTL = 60 * 60 * 1000 // 60分

type CachedProfile = Pick<UserProfile, "id" | "display_name" | "avatar_url" | "updated_at"> & {
  cachedAt: number
}

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
  } catch (error) {
    console.error("Failed to clear user profile cache:", error)
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`Promise timed out after ${ms} ms`)), ms)
    promise.then(resolve, reject).finally(() => clearTimeout(timeoutId))
  })
}

async function fetchUserProfileWithRetry(userId: string, retries = 2): Promise<UserProfile | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data, error } = await withTimeout(
        supabase.from("users").select("*").eq("id", userId).single(),
        10000, // 10秒タイムアウト
      )

      if (error && error.code !== "PGRST116") {
        // "PGRST116" は行が見つからないエラー
        throw error
      }

      if (data) {
        setCachedProfile(data)
        return data
      }

      return null // ユーザーが存在しない場合はnullを返す
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed for getUserProfile:`, error)
      if (i === retries) {
        console.error("All retries failed for getUserProfile.")
        throw error // 最終的に失敗した場合はエラーをスロー
      }
    }
  }
  return null
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null

  // まずキャッシュを確認
  const cachedProfile = getCachedProfileSync(userId)
  if (cachedProfile) {
    return cachedProfile
  }

  // キャッシュにない場合はSupabaseから取得
  return fetchUserProfileWithRetry(userId)
}

export async function createUserProfile(userId: string, email: string): Promise<UserProfile> {
  const displayName = email.split("@")[0]
  const { data, error } = await supabase
    .from("users")
    .insert({ id: userId, display_name: displayName, name: displayName })
    .select()
    .single()

  if (error) throw error

  setCachedProfile(data)
  return data
}

export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
  const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

  if (error) throw error

  setCachedProfile(data)
  return data
}
