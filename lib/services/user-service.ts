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

  try {
    const supabase = createClient()
    console.log("[user-service] 📡 Supabaseクエリ実行: usersテーブルからidで検索 (10秒タイムアウト)")

    // SupabaseのクエリをPromiseとして作成
    const queryPromise = supabase.from("users").select("*").eq("id", userId).maybeSingle() // 0件でもエラーにならない

    // 10秒のタイムアウトを設定してクエリを実行
    const { data, error } = await withTimeout(queryPromise, 10000)

    if (error) {
      console.error(`[user-service] ❌ Supabaseクエリエラー: ${error.message}`, {
        code: error.code,
        details: error.details,
      })
      return null
    }

    if (data) {
      console.log("[user-service] ✅ プロファイル取得成功:", data)
    } else {
      console.log("[user-service] ⚠️ プロファイルが見つかりませんでした。")
    }

    return data
  } catch (exception: any) {
    // タイムアウトエラーもここでキャッチされる
    console.error(`[user-service] 💥 getUserProfileで例外発生: ${exception.message}`)
    return null
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

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        display_name: displayName,
        name: displayName, // nameフィールドにも初期値を設定
      })
      .select()
      .single()

    if (error) {
      console.error(`[user-service] ❌ ユーザープロファイルの作成エラー: ${error.message}`)
      throw error
    }

    console.log("[user-service] ✅ createUserProfile成功:", data)
    return data
  } catch (exception: any) {
    console.error(`[user-service] 💥 createUserProfileで予期せぬ例外発生: ${exception.message}`)
    throw exception
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
    const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

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
