import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/user"

/**
 * 指定されたユーザーIDのプロファイルを取得します。
 * @param userId - 取得するユーザーのID
 * @returns ユーザープロファイルオブジェクト、または見つからない場合はnull
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) {
    // PGRST116は行が見つからない場合のエラーコード
    if (error.code !== "PGRST116") {
      console.error("ユーザープロファイルの取得エラー:", error)
    }
    return null
  }

  return data
}

/**
 * 新しいユーザープロファイルを作成します。
 * @param userId - 新しいユーザーのID
 * @param email - ユーザーのメールアドレス
 * @returns 作成されたユーザープロファイルオブジェクト
 */
export async function createUserProfile(userId: string, email: string): Promise<UserProfile> {
  const supabase = createClient()
  const displayName = email.split("@")[0]

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
    console.error("ユーザープロファイルの作成エラー:", error)
    throw error
  }

  return data
}

/**
 * 既存のユーザープロファイルを更新します。
 * @param userId - 更新するユーザーのID
 * @param profileData - 更新するプロファイルデータ
 * @returns 更新されたユーザープロファイルオブジェクト
 */
export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
  const supabase = createClient()
  const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

  if (error) {
    console.error("ユーザープロファイルの更新エラー:", error)
    throw error
  }

  return data
}
