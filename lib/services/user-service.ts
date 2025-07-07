import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/user"

// キャッシュ関連の定数
const CACHE_KEYS = {
  USER_PROFILE: "pokepoke_user_profile",
  CACHE_TIMESTAMP: "pokepoke_profile_timestamp",
  CONNECTION_STATUS: "pokepoke_connection_status",
} as const

// キャッシュの有効期限（30分）
const CACHE_DURATION = 30 * 60 * 1000

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
      console.log("[user-service] ⏰ キャッシュが期限切れです", { ageMinutes: Math.round(cacheAge / 60000) })
      clearProfileCache()
      return null
    }

    const profile: UserProfile = JSON.parse(cachedData)
    if (profile.id !== userId) {
      console.log("[user-service] 🔄 異なるユーザーのキャッシュです")
      clearProfileCache()
      return null
    }

    console.log("[user-service] ✅ キャッシュからプロファイル取得:", profile.display_name || profile.pokepoke_id)
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
    console.log("[user-service] 💾 プロファイルをキャッシュに保存:", profile.display_name || profile.pokepoke_id)
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

  // キャッシュから取得を試行（強制更新でない場合）
  if (!forceRefresh) {
    const cachedProfile = getCachedProfile(userId)
    if (cachedProfile) {
      // バックグラウンドで最新データを取得して更新
      setTimeout(() => {
        getUserProfile(userId, true)
          .then((freshProfile) => {
            if (freshProfile && JSON.stringify(freshProfile) !== JSON.stringify(cachedProfile)) {
              console.log("[user-service] 🔄 バックグラウンド更新: プロファイルに変更があります")
              setCachedProfile(freshProfile)
              // カスタムイベントを発火してUIに更新を通知
              window.dispatchEvent(new CustomEvent("profileUpdated", { detail: freshProfile }))
            }
          })
          .catch((error) => {
            console.log("[user-service] ⚠️ バックグラウンド更新失敗:", error.message)
          })
      }, 100)

      return cachedProfile
    }
  }

  try {
    const supabase = createClient()
    console.log("[user-service] 📡 Supabaseクエリ実行: usersテーブルからidで検索 (10秒タイムアウト)")

    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("[user-service] 🔍 環境変数確認:", {
      hasUrl: !!supabaseUrl,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "未設定",
      hasAnonKey: !!supabaseAnonKey,
      anonKeyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + "..." : "未設定",
    })

    // 明示的にカラムを指定してavatar_urlを確実に取得
    const queryPromise = supabase
      .from("users")
      .select("id, display_name, name, pokepoke_id, avatar_url, email, created_at, is_admin")
      .eq("id", userId)
      .maybeSingle()

    const { data, error } = await withTimeout(queryPromise, 10000)

    if (error) {
      console.error(`[user-service] ❌ Supabaseクエリエラー: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      // エラーが発生した場合でも、基本的なプロファイルを返す
      console.log("[user-service] 🔄 エラー時のフォールバック処理を実行します。")
      const fallbackProfile = createFallbackProfile(userId)
      setCachedProfile(fallbackProfile)
      return fallbackProfile
    }

    if (data) {
      console.log("[user-service] ✅ プロファイル取得成功:", {
        id: data.id,
        display_name: data.display_name,
        name: data.name,
        pokepoke_id: data.pokepoke_id,
        avatar_url: data.avatar_url,
        email: data.email,
        hasAvatar: !!data.avatar_url,
        avatarLength: data.avatar_url ? data.avatar_url.length : 0,
      })
      setCachedProfile(data)
      return data
    } else {
      console.log("[user-service] ⚠️ プロファイルが見つかりませんでした。新規作成が必要です。")
      return null
    }
  } catch (exception: any) {
    console.error(`[user-service] 💥 getUserProfileで例外発生: ${exception.message}`)
    console.error("[user-service] 🔄 例外時のフォールバック処理を実行します。")

    // 例外が発生した場合でも、基本的なプロファイルを返す
    const fallbackProfile = createFallbackProfile(userId)
    setCachedProfile(fallbackProfile)
    return fallbackProfile
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
    avatar_url: null,
    created_at: new Date().toISOString(),
  }
}

/**
 * 新しいユーザープロファイルを作成します。
 * @param userId - 新しいユーザーのID
 * @param email - ユーザーのメールアドレス
 * @returns 作成されたユーザープロファイルオブジェクト
 */
export async function createUserProfile(userId: string, email: string): Promise<UserProfile> {
  console.log(`[user-service] 📝 createUserProfile 開始: userId=${userId}, email=${email}`)

  try {
    const supabase = createClient()
    const displayName = email.split("@")[0]

    console.log(`[user-service] 📡 新規プロファイル作成中 - displayName: ${displayName}`)

    const insertPromise = supabase
      .from("users")
      .insert({
        id: userId,
        display_name: displayName,
        name: displayName,
      })
      .select("id, display_name, name, pokepoke_id, avatar_url, email, created_at, is_admin")
      .single()

    const { data, error } = await withTimeout(insertPromise, 10000)

    if (error) {
      console.error(`[user-service] ❌ ユーザープロファイルの作成エラー: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      const fallbackProfile = {
        id: userId,
        display_name: displayName,
        name: displayName,
        pokepoke_id: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
      }
      setCachedProfile(fallbackProfile)
      return fallbackProfile
    }

    console.log("[user-service] ✅ createUserProfile成功:", {
      id: data.id,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      hasAvatar: !!data.avatar_url,
    })
    setCachedProfile(data)
    return data
  } catch (exception: any) {
    console.error(`[user-service] 💥 createUserProfileで予期せぬ例外発生: ${exception.message}`)

    const displayName = email.split("@")[0]
    const fallbackProfile = {
      id: userId,
      display_name: displayName,
      name: displayName,
      pokepoke_id: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
    }
    setCachedProfile(fallbackProfile)
    return fallbackProfile
  }
}

/**
 * 既存のユーザープロファイルを更新します。
 * @param userId - 更新するユーザーのID
 * @param profileData - 更新するプロファイルデータ
 * @returns 更新されたユーザープロファイルオブジェクト
 */
export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
  console.log(`[user-service] 🔄 updateUserProfile 開始: userId=${userId}`, profileData)

  try {
    const supabase = createClient()

    const updatePromise = supabase
      .from("users")
      .update(profileData)
      .eq("id", userId)
      .select("id, display_name, name, pokepoke_id, avatar_url, email, created_at, is_admin")
      .single()

    const { data, error } = await withTimeout(updatePromise, 10000)

    if (error) {
      console.error(`[user-service] ❌ ユーザープロファイルの更新エラー: ${error.message}`)
      throw error
    }

    console.log("[user-service] ✅ updateUserProfile成功:", {
      id: data.id,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      hasAvatar: !!data.avatar_url,
    })

    // 更新成功時にキャッシュも更新
    setCachedProfile(data)

    // カスタムイベントを発火してUIに更新を通知
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
