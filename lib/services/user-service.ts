import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/user"

/**
 * 指定されたユーザーIDのプロファイルを取得します。
 * @param userId - 取得するユーザーのID
 * @returns ユーザープロファイルオブジェクト、または見つからない場合はnull
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  console.log("🔍 getUserProfile開始 - userId:", userId)

  const supabase = createClient()

  // 方法1 (旧テスト2): 単純なselect文（limit付き）を最初のテストとして実行
  console.log("🧪 テスト1開始: 単純なselect (limit 1)")
  try {
    const { data, error } = await supabase.from("users").select("id").limit(1)

    console.log("📊 テスト1結果:", {
      success: !error,
      dataLength: data?.length || 0,
      error: error?.message || null,
    })
    if (!error && data && data.length > 0) {
      console.log("✅ テスト1成功 - データ取得:", data[0])
      // このテストはプロファイル全体を取得しないため、ここでは返さない
      // 目的はテーブルアクセスが成功するかどうかを確認すること
    }
  } catch (exception) {
    console.error("💥 テスト1例外:", exception)
  }
  console.log("✅ テスト1完了")

  // 方法2 (旧テスト1): 基本的なテーブル存在確認
  console.log("🧪 テスト2開始: テーブル存在確認 (count)")
  try {
    const { count, error: countError } = await supabase.from("users").select("*", { count: "exact", head: true })

    console.log("📊 テスト2結果:", {
      success: !countError,
      count: count,
      error: countError?.message || null,
    })
  } catch (exception) {
    console.error("💥 テスト2例外:", exception)
  }
  console.log("✅ テスト2完了")

  // 方法3 (旧テスト3): 全件取得（最大10件）
  console.log("🧪 テスト3開始: 全件取得 (limit 10)")
  try {
    const { data, error } = await supabase.from("users").select("*").limit(10)

    console.log("📊 テスト3結果:", {
      success: !error,
      dataLength: data?.length || 0,
      error: error?.message || null,
      hasTargetUser: data?.some((user) => user.id === userId) || false,
    })

    if (!error && data && data.length > 0) {
      const targetUser = data.find((user) => user.id === userId)
      if (targetUser) {
        console.log("✅ テスト3で対象ユーザー発見:", targetUser)
        return targetUser
      }
    }
  } catch (exception) {
    console.error("💥 テスト3例外:", exception)
  }
  console.log("✅ テスト3完了")

  // 方法4 (旧テスト4): 特定のカラムのみ選択してフィルター
  console.log("🧪 テスト4開始: 特定カラム選択 + フィルター")
  try {
    const { data, error } = await supabase.from("users").select("id, display_name, name").eq("id", userId).limit(1)

    console.log("📊 テスト4結果:", {
      success: !error,
      dataLength: data?.length || 0,
      error: error?.message || null,
      rawData: data,
    })

    if (!error && data && data.length > 0) {
      console.log("✅ テスト4成功 - 部分データ取得:", data[0])
      // 完全なデータを取得するため、再度全カラムで取得
      console.log("🔄 テスト4-2: 完全データ取得")
      const { data: fullData, error: fullError } = await supabase.from("users").select("*").eq("id", userId).limit(1)

      console.log("📊 テスト4-2結果:", {
        success: !fullError,
        dataLength: fullData?.length || 0,
        error: fullError?.message || null,
      })

      if (!fullError && fullData && fullData.length > 0) {
        console.log("✅ テスト4完全データ取得成功:", fullData[0])
        return fullData[0]
      }
    }
  } catch (exception) {
    console.error("💥 テスト4例外:", exception)
  }
  console.log("✅ テスト4完了")

  // 方法5 (旧テスト5): single()を再試行（エラーハンドリング強化）
  console.log("🧪 テスト5開始: single()再試行")
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    console.log("📊 テスト5結果:", {
      success: !error,
      hasData: !!data,
      error: error?.message || null,
      errorCode: error?.code || null,
      errorDetails: error?.details || null,
    })

    if (!error && data) {
      console.log("✅ テスト5成功 - single()でデータ取得:", data)
      return data
    }
  } catch (exception) {
    console.error("💥 テスト5例外:", exception)
  }
  console.log("✅ テスト5完了")

  // 方法6 (旧テスト6): maybeSingle()を使用
  console.log("🧪 テスト6開始: maybeSingle()使用")
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle()

    console.log("📊 テスト6結果:", {
      success: !error,
      hasData: !!data,
      error: error?.message || null,
      rawData: data,
    })

    if (!error && data) {
      console.log("✅ テスト6成功 - maybeSingle()でデータ取得:", data)
      return data
    }
  } catch (exception) {
    console.error("💥 テスト6例外:", exception)
  }
  console.log("✅ テスト6完了")

  console.log("❌ 全てのテストが失敗 - プロファイルが見つかりません:", userId)
  return null
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
