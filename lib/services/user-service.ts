import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/user"

// キャッシュ関連の定数
const CACHE_KEYS = {
  USER_PROFILE: "pokepoke_user_profile",
  CACHE_TIMESTAMP: "pokepoke_profile_timestamp",
} as const

// キャッシュの有効期限（1時間）
const CACHE_DURATION = 60 * 60 * 1000

/**
 * ローカルストレージからプロファイルキャッシュを取得
 */
function getCachedProfile(userId: string): UserProfile | null {
  try {
    const cachedData = localStorage.getItem(CACHE_KEYS.USER_PROFILE)
    const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP)

    if (!cachedData || !timestamp) {
      console.log("[user-service] 📦 キャッシュが存在しません")
      return null
    }

    const cacheAge = Date.now() - Number.parseInt(timestamp)
    if (cacheAge > CACHE_DURATION) {
      console.log(`[user-service] ⏰ キャッシュが期限切れです (有効期間: ${Math.round(CACHE_DURATION / 60000)}分)`)
      clearProfileCache()
      return null
    }

    const profile: UserProfile = JSON.parse(cachedData)
    if (profile.id !== userId) {
      console.log("[user-service] 🔄 ユーザーが異なるためキャッシュをクリアします")
      clearProfileCache()
      return null
    }

    console.log("[user-service] ✅ キャッシュからプロファイル取得:", profile)
    return profile
  } catch (error) {
    console.error("[user-service] ❌ キャッシュ読み込みエラー:", error)
    clearProfileCache()
    return null
  }
}

/**
 * プロファイルをローカルストレージにキャッシュ
 */
function setCachedProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(CACHE_KEYS.USER_PROFILE, JSON.stringify(profile))
    localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString())
    console.log("[user-service] 💾 プロファイルをキャッシュに保存:", profile)
  } catch (error) {
    console.error("[user-service] ❌ キャッシュ保存エラー:", error)
  }
}

/**
 * プロファイルキャッシュをクリア
 */
function clearProfileCache(): void {
  try {
    localStorage.removeItem(CACHE_KEYS.USER_PROFILE)
    localStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP)
    console.log("[user-service] 🗑️ プロファイルキャッシュをクリア")
  } catch (error) {
    console.error("[user-service] ❌ キャッシュクリアエラー:", error)
  }
}

/**
 * Promiseにタイムアウトを設定するヘルパー関数
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Promise timed out after ${ms} ms`))
    }, ms)

    promise
      .then((res) => {
        clearTimeout(timeoutId)
        resolve(res)
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        reject(err)
      })
  })
}

/**
 * 指定されたユーザーIDのプロファイルを取得します。
 * キャッシュを優先し、バックグラウンドで更新します。
 * @param userId - 取得するユーザーのID
 * @param forceRefresh - キャッシュを無視して強制的に再取得するか
 * @returns ユーザープロファイルオブジェクト、または見つからない場合はnull
 */
export async function getUserProfile(userId: string, forceRefresh = false): Promise<UserProfile | null> {
  console.log(`[user-service] 🔍 getUserProfile 開始: userId=${userId}, forceRefresh=${forceRefresh}`)

  if (!userId) {
    console.error("[user-service] ❌ userIdが指定されていません。")
    return null
  }

  // 強制更新でない場合、まずキャッシュから取得を試みる
  if (!forceRefresh) {
    const cachedProfile = getCachedProfile(userId)
    if (cachedProfile) {
      // バックグラウンドで最新データを非同期に取得
      fetchFreshProfile(userId, cachedProfile)
      return cachedProfile
    }
  }

  // キャッシュがない、または強制更新の場合はDBから直接取得
  return await fetchAndCacheProfile(userId)
}

/**
 * バックグラウンドで最新のプロファイルを取得し、更新があればイベントを発火
 */
async function fetchFreshProfile(userId: string, oldProfile: UserProfile): Promise<void> {
  console.log("[user-service] 🔄 バックグラウンドでプロファイル更新を開始")
  try {
    const freshProfile = await fetchAndCacheProfile(userId, false) // ここではログを抑制
    if (freshProfile && JSON.stringify(freshProfile) !== JSON.stringify(oldProfile)) {
      console.log("[user-service] ✨ プロファイルに更新がありました。イベントを発火します。")
      window.dispatchEvent(new CustomEvent("profileUpdated", { detail: freshProfile }))
    } else {
      console.log("[user-service] ✔️ プロファイルは最新です。")
    }
  } catch (error) {
    console.error("[user-service] ⚠️ バックグラウンド更新中にエラー:", error)
  }
}

/**
 * DBからプロファイルを取得し、キャッシュに保存するコアロジック
 */
async function fetchAndCacheProfile(userId: string, log = true): Promise<UserProfile | null> {
  if (log) console.log("[user-service] ☁️ DBからプロファイルを取得します...")
  try {
    const supabase = createClient()
    const queryPromise = supabase.from("users").select("*").eq("id", userId).maybeSingle()
    const { data, error } = await withTimeout(queryPromise, 8000) // タイムアウトを8秒に延長

    if (error) {
      console.error(`[user-service] ❌ Supabaseクエリエラー: ${error.message}`)
      return createFallbackProfile(userId) // エラー時もフォールバックを返す
    }

    if (data) {
      if (log) console.log("[user-service] ✅ DBからプロファイル取得成功:", data)
      setCachedProfile(data)
      return data
    } else {
      if (log) console.log("[user-service] ⚠️ DBにプロファイルが見つかりません。新規作成を試みます。")
      // DBにプロファイルがない場合、auth情報から作成を試みる
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user && user.email) {
        return await createUserProfile(userId, user.email)
      }
      return null
    }
  } catch (exception: any) {
    console.error(`[user-service] 💥 fetchAndCacheProfileで例外発生: ${exception.message}`)
    return createFallbackProfile(userId)
  }
}

/**
 * フォールバック用の基本プロファイルを作成
 */
function createFallbackProfile(userId: string): UserProfile {
  console.log("[user-service] 🆘 フォールバックプロファイル作成:", userId)
  return {
    id: userId,
    display_name: "ユーザー",
    name: "ユーザー",
    pokepoke_id: null,
    avatar_url: null, // avatar_urlを明示的に含める
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * 新しいユーザープロファイルを作成します。
 */
export async function createUserProfile(userId: string, email: string): Promise<UserProfile> {
  console.log(`[user-service] 📝 createUserProfile 開始: userId=${userId}, email=${email}`)
  try {
    const supabase = createClient()
    const displayName = email.split("@")[0]

    // auth.userからアバターURLを取得
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const avatarUrl = user?.user_metadata?.avatar_url || null

    console.log(`[user-service] 📡 新規プロファイル作成中 - displayName: ${displayName}, avatar_url: ${avatarUrl}`)

    const insertPromise = supabase
      .from("users")
      .insert({
        id: userId,
        display_name: displayName,
        name: displayName,
        avatar_url: avatarUrl,
      })
      .select()
      .single()

    const { data, error } = await withTimeout(insertPromise, 8000)

    if (error) {
      console.error(`[user-service] ❌ ユーザープロファイルの作成エラー: ${error.message}`)
      const fallback = createFallbackProfile(userId)
      setCachedProfile(fallback)
      return fallback
    }

    console.log("[user-service] ✅ createUserProfile成功:", data)
    setCachedProfile(data)
    return data
  } catch (exception: any) {
    console.error(`[user-service] 💥 createUserProfileで予期せぬ例外発生: ${exception.message}`)
    const fallback = createFallbackProfile(userId)
    setCachedProfile(fallback)
    return fallback
  }
}

/**
 * 既存のユーザープロファイルを更新します。
 */
export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
  console.log(`[user-service] 🔄 updateUserProfile 開始: userId=${userId}`, profileData)
  try {
    const supabase = createClient()
    const updatePromise = supabase.from("users").update(profileData).eq("id", userId).select().single()
    const { data, error } = await withTimeout(updatePromise, 8000)

    if (error) {
      console.error(`[user-service] ❌ ユーザープロファイルの更新エラー: ${error.message}`)
      throw error
    }

    console.log("[user-service] ✅ updateUserProfile成功:", data)
    setCachedProfile(data)
    window.dispatchEvent(new CustomEvent("profileUpdated", { detail: data }))
    return data
  } catch (exception: any) {
    console.error(`[user-service] 💥 updateUserProfileで予期せぬ例外発生: ${exception.message}`)
    throw exception
  }
}

/**
 * プロファイルキャッシュをクリアする（ログアウト時など）
 */
export function clearUserProfileCache(): void {
  clearProfileCache()
}
