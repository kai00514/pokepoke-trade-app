import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/user"

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

    // 簡単なクエリでテスト（3秒タイムアウト）
    const testPromise = supabase.from("users").select("count", { count: "exact", head: true })
    const { count, error } = await withTimeout(testPromise, 3000)

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
 * @returns ユーザープロファイルオブジェクト、または見つからない場合はnull
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log(`[user-service] 🔍 getUserProfile 開始: userId=${userId}`)

  if (!userId) {
    console.error("[user-service] ❌ userIdが指定されていません。")
    return null
  }

  // まずSupabase接続をテスト
  const isConnected = await testSupabaseConnection()
  if (!isConnected) {
    console.error("[user-service] ❌ Supabase接続に失敗しました。フォールバック処理を実行します。")
    // フォールバック: 基本的なプロファイルを作成
    return createFallbackProfile(userId)
  }

  try {
    const supabase = createClient()
    console.log("[user-service] 📡 Supabaseクエリ実行: usersテーブルからidで検索 (5秒タイムアウト)")

    // タイムアウトを5秒に短縮
    const queryPromise = supabase.from("users").select("*").eq("id", userId).maybeSingle()
    const { data, error } = await withTimeout(queryPromise, 5000)

    if (error) {
      console.error(`[user-service] ❌ Supabaseクエリエラー: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      return createFallbackProfile(userId)
    }

    if (data) {
      console.log("[user-service] ✅ プロファイル取得成功:", data)
      return data
    } else {
      console.log("[user-service] ⚠️ プロファイルが見つかりませんでした。")
      return null
    }
  } catch (exception: any) {
    console.error(`[user-service] 💥 getUserProfileで例外発生: ${exception.message}`)
    console.error("[user-service] 🔄 フォールバック処理を実行します。")
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

  // まずSupabase接続をテスト
  const isConnected = await testSupabaseConnection()
  if (!isConnected) {
    console.error("[user-service] ❌ Supabase接続に失敗しました。フォールバックプロファイルを返します。")
    const displayName = email.split("@")[0]
    return {
      id: userId,
      display_name: displayName,
      name: displayName,
      pokepoke_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  try {
    const supabase = createClient()
    const displayName = email.split("@")[0]

    console.log(`[user-service] 📡 新規プロファイル作成中 - displayName: ${displayName}`)

    // タイムアウトを5秒に設定
    const insertPromise = supabase
      .from("users")
      .insert({
        id: userId,
        display_name: displayName,
        name: displayName,
      })
      .select()
      .single()

    const { data, error } = await withTimeout(insertPromise, 5000)

    if (error) {
      console.error(`[user-service] ❌ ユーザープロファイルの作成エラー: ${error.message}`, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      // フォールバックプロファイルを返す
      return {
        id: userId,
        display_name: displayName,
        name: displayName,
        pokepoke_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    console.log("[user-service] ✅ createUserProfile成功:", data)
    return data
  } catch (exception: any) {
    console.error(`[user-service] 💥 createUserProfileで予期せぬ例外発生: ${exception.message}`)

    // フォールバックプロファイルを返す
    const displayName = email.split("@")[0]
    return {
      id: userId,
      display_name: displayName,
      name: displayName,
      pokepoke_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
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

    // タイムアウトを5秒に設定
    const updatePromise = supabase.from("users").update(profileData).eq("id", userId).select().single()
    const { data, error } = await withTimeout(updatePromise, 5000)

    if (error) {
      console.error(`[user-service] ❌ ユーザープロファイルの更新エラー: ${error.message}`)
      throw error
    }

    console.log("[user-service] ✅ updateUserProfile成功:", data)
    return data
  } catch (exception: any) {
    console.error(`[user-service] 💥 updateUserProfileで予期せぬ例外発生: ${exception.message}`)
    throw exception
  }
}
