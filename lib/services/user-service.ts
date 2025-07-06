import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/user"

/**
 * 指定されたユーザーIDのプロファイルを取得します。
 * @param userId - 取得するユーザーのID
 * @returns ユーザープロファイルオブジェクト、または見つからない場合はnull
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log("🔍 getUserProfile開始 - userId:", userId)

  try {
    const supabase = createClient()
    console.log("📡 Supabaseクエリ実行中 - テーブル: users, フィルター: id =", userId)

    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    console.log("📊 Supabaseクエリ結果:", {
      data: !!data,
      error: error?.message || null,
      errorCode: error?.code || null,
    })

    if (error) {
      // PGRST116は行が見つからない場合のエラーコード
      if (error.code !== "PGRST116") {
        console.error("❌ ユーザープロファイルの取得エラー:", error)
      } else {
        console.log("ℹ️ ユーザープロファイルが見つかりません (PGRST116):", userId)
      }
      return null
    }

    console.log("✅ getUserProfile成功 - データ:", data)
    return data
  } catch (exception) {
    console.error("💥 getUserProfile例外発生:", exception)
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
  console.log("📝 createUserProfile開始 - userId:", userId, "email:", email)

  try {
    const supabase = createClient()
    const displayName = email.split("@")[0]

    console.log("📡 新規プロファイル作成中 - displayName:", displayName)

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        display_name: displayName,
        name: displayName, // nameフィールドにも初期値を設定
      })
      .select()
      .single()

    console.log("📊 プロファイル作成結果:", { data: !!data, error: error?.message || null })

    if (error) {
      console.error("❌ ユーザープロファイルの作成エラー:", error)
      throw error
    }

    console.log("✅ createUserProfile成功 - データ:", data)
    return data
  } catch (exception) {
    console.error("💥 createUserProfile例外発生:", exception)
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
  console.log("🔄 updateUserProfile開始 - userId:", userId, "profileData:", profileData)

  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

    console.log("📊 プロファイル更新結果:", { data: !!data, error: error?.message || null })

    if (error) {
      console.error("❌ ユーザープロファイルの更新エラー:", error)
      throw error
    }

    console.log("✅ updateUserProfile成功 - データ:", data)
    return data
  } catch (exception) {
    console.error("💥 updateUserProfile例外発生:", exception)
    throw exception
  }
}
