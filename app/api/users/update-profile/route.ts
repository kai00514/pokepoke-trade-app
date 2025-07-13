import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, profileData } = body

    if (!userId || !profileData) {
      return NextResponse.json({ error: "Missing userId or profileData" }, { status: 400 })
    }

    // Supabaseクライアントを作成
    const supabase = await createClient()

    // 現在のセッションを確認
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    // セッションのユーザーIDと更新対象のユーザーIDが一致するかチェック
    if (!session || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 更新データを準備
    const updateData = {
      ...profileData,
    }

    // まず現在のデータを確認
    const { data: currentData, error: selectError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (selectError && selectError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to fetch current user data", details: selectError.message },
        { status: 500 },
      )
    }

    let result

    if (!currentData) {
      // ユーザーレコードが存在しない場合は作成
      const { data: insertData, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          ...updateData,
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to create user record", details: insertError.message },
          { status: 500 },
        )
      }

      result = insertData
    } else {
      // ユーザーレコードが存在する場合は更新
      const { data: updateResult, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update user record", details: updateError.message },
          { status: 500 },
        )
      }

      result = updateResult
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Profile updated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
