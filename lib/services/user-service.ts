import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/user"

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
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    return null
  }

  try {
    const supabase = createClient()
    const queryPromise = supabase.from("users").select("*").eq("id", userId).maybeSingle()
    const { data, error } = await withTimeout(queryPromise, 8000)

    if (error) {
      console.error("[user-service] プロファイル取得エラー:", error.message)
      return createFallbackProfile(userId)
    }

    return data
  } catch (exception: any) {
    console.error("[user-service] プロファイル取得例外:", exception.message)
    return createFallbackProfile(userId)
  }
}

/**
 * フォールバック用の基本プロファイルを作成
 */
function createFallbackProfile(userId: string): UserProfile {
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
 */
export async function createUserProfile(userId: string, email: string): Promise<UserProfile> {
  const displayName = email.split("@")[0]

  try {
    const supabase = createClient()
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
      console.error("[user-service] プロファイル作成エラー:", error.message)
      return createFallbackProfile(userId)
    }

    return data
  } catch (exception: any) {
    console.error("[user-service] プロファイル作成例外:", exception.message)
    return createFallbackProfile(userId)
  }
}

/**
 * 既存のユーザープロファイルを更新します。
 */
export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
  const supabase = createClient()
  const updatePromise = supabase.from("users").update(profileData).eq("id", userId).select().single()
  const { data, error } = await withTimeout(updatePromise, 8000)

  if (error) {
    console.error("[user-service] プロファイル更新エラー:", error.message)
    throw error
  }

  return data
}
