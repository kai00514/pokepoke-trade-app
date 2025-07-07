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
      console.log(`[user-service] ⏰ キャッシュが期限切れです (${Math.round(cacheAge / 60000)}分経過)`)
      clearProfileCache()
      return null
    }

    const profile: UserProfile = JSON.parse(cachedData)
    if (profile.id !== userId) {
      console.log("[user-service] 🔄 ユーザーが異なるためキャッシュをクリアします")
      clearProfileCache()
      return null
    }

    console.log("[user-service] ✅ キャッシュからプロファイル取得:", {
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      pokepoke_id: profile.pokepoke_id,
    })
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
    console.log("[user-service] 💾 プロファイルをキャッシュに保存:", {
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      pokepoke_id: profile.pokepoke_id,
    })
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
 * @param promise - 対象のPromise
 * @param ms - タイムアウト時間（ミリ秒）
 * @returns タイムアウト付きの新しいPromise
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
 * Supabase接続テスト関数
 */
async function testSupabaseConnection(): Promise<boolean> {
  console.log("[user-service] 🔧 Supabase接続テスト開始")

  try {
    const supabase = createClient()

    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("[user-service] 🔍 環境変数確認:", {
      hasUrl: !!supabaseUrl,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : "未設定",
      hasAnonKey: !!supabaseAnonKey,
      anonKeyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + "..." : "未設定",
    })

    // 簡単なクエリでテスト（5秒タイムアウト）
    const testPromise = supabase.from("users").select("count", { count: "exact", head: true })
    const { count, error } = await withTimeout(testPromise, 5000)

    if (error) {
      console.error("[user-service] ❌ 接続テスト失敗:", error.message)
      return false
    }

    console.log("[user-service] ✅ 接続テスト成功 - レコード数:", count)
    return true
  } catch (exception: any) {
    console.error("[user-service] 💥 接続テスト例外:", exception.message)
    return false
  }
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

  // 強制更新でない場合、まずキャッシュから取得を試みる
  if (!forceRefresh) {
    const cachedProfile = getCachedProfile(userId)
    if (cachedProfile) {
      console.log("[user-service] 🚀 キャッシュからプロファイルを返します")

      // バックグラウンドで最新データを取得して更新
      setTimeout(async () => {
        try {
          console.log("[user-service] 🔄 バックグラウンドで最新データを取得中...")
          const freshProfile = await fetchProfileFromDB(userId)
          if (freshProfile && JSON.stringify(freshProfile) !== JSON.stringify(cachedProfile)) {
            console.log("[user-service] ✨ プロファイルに更新がありました")
            setCachedProfile(freshProfile)
            // カスタムイベントを発火してUIに更新を通知
            window.dispatchEvent(new CustomEvent("profileUpdated", { detail: freshProfile }))
          }
        } catch (error) {
          console.log("[user-service] ⚠️ バックグラウンド更新失敗:", error)
        }
      }, 100)

      return cachedProfile
    }
  }

  // キャッシュがない、または強制更新の場合はDBから直接取得
  return await fetchProfileFromDB(userId)
}

/**
 * DBからプロファイルを取得し、キャッシュに保存
 */
async function fetchProfileFromDB(userId: string): Promise<UserProfile | null> {
  // まずSupabase接続をテスト
  const isConnected = await testSupabaseConnection()
  if (!isConnected) {
    console.error("[user-service] ❌ Supabase接続に失敗しました。フォールバック処理を実行します。")
    const fallbackProfile = createFallbackProfile(userId)
    setCachedProfile(fallbackProfile)
    return fallbackProfile
  }

  try {
    const supabase = createClient()
    console.log("[user-service] 📡 Supabaseクエリ実行: usersテーブルからidで検索 (8秒タイムアウト)")

    // タイムアウトを8秒に延長
    const queryPromise = supabase.from("users").select("*").eq("id", userId).maybeSingle()
    const { data, error } = await withTimeout(queryPromise, 8000)

    if (error) {
      console.error(`[user-service] ❌ Supabaseクエリエラー: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      const fallbackProfile = createFallbackProfile(userId)
      setCachedProfile(fallbackProfile)
      return fallbackProfile
    }

    if (data) {
      console.log("[user-service] ✅ プロファイル取得成功:", data)
      setCachedProfile(data)
      return data
    } else {
      console.log("[user-service] ⚠️ プロファイルが見つかりませんでした。")
      return null
    }
  } catch (exception: any) {
    console.error(`[user-service] 💥 fetchProfileFromDBで例外発生: ${exception.message}`)
    console.error("[user-service] 🔄 フォールバック処理を実行します。")
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

  const fallbackProfile: UserProfile = {
    id: userId,
    display_name: "ユーザー",
    name: "ユーザー",
    pokepoke_id: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log("[user-service] 📦 フォールバックプロファイル詳細:", fallbackProfile)
  return fallbackProfile
}

/**
 * 新しいユーザープロファイルを作成します。
 * @param userId - 新しいユーザーのID
 * @param email - ユーザーのメールアドレス
 * @returns 作成されたユーザープロファイルオブジェクト
 */
export async function createUserProfile(userId: string, email: string): Promise<UserProfile> {
  console.log(`[user-service] 📝 createUserProfile 開始: userId=${userId}, email=${email}`)

  // まずSupabase接続をテスト
  const isConnected = await testSupabaseConnection()
  if (!isConnected) {
    console.error("[user-service] ❌ Supabase接続に失敗しました。フォールバックプロファイルを返します。")
    const displayName = email.split("@")[0]
    const fallbackProfile: UserProfile = {
      id: userId,
      display_name: displayName,
      name: displayName,
      pokepoke_id: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setCachedProfile(fallbackProfile)
    return fallbackProfile
  }

  try {
    const supabase = createClient()
    const displayName = email.split("@")[0]

    console.log(`[user-service] 📡 新規プロファイル作成中 - displayName: ${displayName}`)

    // タイムアウトを8秒に設定
    const insertPromise = supabase
      .from("users")
      .insert({
        id: userId,
        display_name: displayName,
        name: displayName,
      })
      .select()
      .single()

    const { data, error } = await withTimeout(insertPromise, 8000)

    if (error) {
      console.error(`[user-service] ❌ ユーザープロファイルの作成エラー: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      // フォールバックプロファイルを返す
      const fallbackProfile: UserProfile = {
        id: userId,
        display_name: displayName,
        name: displayName,
        pokepoke_id: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setCachedProfile(fallbackProfile)
      return fallbackProfile
    }

    console.log("[user-service] ✅ createUserProfile成功:", data)
    setCachedProfile(data)
    return data
  } catch (exception: any) {
    console.error(`[user-service] 💥 createUserProfileで予期せぬ例外発生: ${exception.message}`)

    // フォールバックプロファイルを返す
    const displayName = email.split("@")[0]
    const fallbackProfile: UserProfile = {
      id: userId,
      display_name: displayName,
      name: displayName,
      pokepoke_id: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

    // タイムアウトを8秒に設定
    const updatePromise = supabase.from("users").update(profileData).eq("id", userId).select().single()
    const { data, error } = await withTimeout(updatePromise, 8000)

    if (error) {
      console.error(`[user-service] ❌ ユーザープロファイルの更新エラー: ${error.message}`)
      throw error
    }

    console.log("[user-service] ✅ updateUserProfile成功:", data)

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
  console.log("[user-service] 🧹 プロファイルキャッシュクリア実行")
  clearProfileCache()
}
