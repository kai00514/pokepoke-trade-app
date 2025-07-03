import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("🌐 [API] /api/users/update-profile - START")

  try {
    const { userId, profileData } = await request.json()

    console.log("🌐 [API] Request data:", { userId, profileData })

    if (!userId || !profileData) {
      console.error("❌ [API] Missing required fields")
      return NextResponse.json({ error: "ユーザーIDとプロファイルデータが必要です" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // 現在の認証状態を確認
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("🌐 [API] Auth check:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    })

    if (authError || !user) {
      console.error("❌ [API] Authentication failed:", authError)
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // ユーザーIDの一致を確認
    if (user.id !== userId) {
      console.error("❌ [API] User ID mismatch:", {
        authUserId: user.id,
        requestUserId: userId,
      })
      return NextResponse.json({ error: "ユーザーIDが一致しません" }, { status: 403 })
    }

    // まず現在のユーザーデータを確認
    console.log("🌐 [API] Checking existing user data...")
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    console.log("🌐 [API] Existing user check:", {
      hasExistingUser: !!existingUser,
      selectError: selectError?.message,
      selectErrorCode: selectError?.code,
    })

    let updatedUser

    if (selectError && selectError.code === "PGRST116") {
      // ユーザーレコードが存在しない場合は作成
      console.log("🌐 [API] Creating new user record...")
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: user.email,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      console.log("🌐 [API] Insert result:", {
        data: newUser,
        error: insertError?.message,
      })

      if (insertError) {
        console.error("❌ [API] Insert error:", insertError)
        return NextResponse.json(
          { error: "ユーザーレコードの作成に失敗しました", details: insertError.message },
          { status: 500 },
        )
      }

      updatedUser = newUser
    } else if (selectError) {
      // その他のエラー
      console.error("❌ [API] Select error:", selectError)
      return NextResponse.json(
        { error: "ユーザーデータの取得に失敗しました", details: selectError.message },
        { status: 500 },
      )
    } else {
      // ユーザーレコードが存在する場合は更新
      console.log("🌐 [API] Updating existing user record...")
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single()

      console.log("🌐 [API] Update result:", {
        data: updated,
        error: updateError?.message,
      })

      if (updateError) {
        console.error("❌ [API] Update error:", updateError)
        return NextResponse.json(
          { error: "ユーザーデータの更新に失敗しました", details: updateError.message },
          { status: 500 },
        )
      }

      updatedUser = updated
    }

    console.log("✅ [API] Success:", updatedUser)

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "ユーザープロファイルが正常に更新されました",
    })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      {
        error: "サーバーエラーが発生しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
