import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 [API] update-profile endpoint called")

    const body = await request.json()
    console.log("🔧 [API] Request body:", body)

    const { userId, profileData } = body

    if (!userId || !profileData) {
      console.error("❌ [API] Missing required fields:", { userId: !!userId, profileData: !!profileData })
      return NextResponse.json({ error: "Missing userId or profileData" }, { status: 400 })
    }

    // Supabaseクライアントを作成
    const supabase = await createClient()
    console.log("🔧 [API] Supabase client created")

    // 現在のセッションを確認
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ [API] Session error:", sessionError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    console.log("🔧 [API] Session check:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      requestedUserId: userId,
    })

    // セッションのユーザーIDと更新対象のユーザーIDが一致するかチェック
    if (!session || session.user.id !== userId) {
      console.error("❌ [API] Unauthorized: User ID mismatch")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // 更新データを準備
    const updateData = {
      ...profileData,
    }

    console.log("🔧 [API] Update data prepared:", updateData)

    // まず現在のデータを確認
    const { data: currentData, error: selectError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (selectError && selectError.code !== "PGRST116") {
      console.error("❌ [API] Error fetching current data:", selectError)
      return NextResponse.json(
        { error: "Failed to fetch current user data", details: selectError.message },
        { status: 500 },
      )
    }

    let result

    if (!currentData) {
      // ユーザーレコードが存在しない場合は作成
      console.log("🔧 [API] User record not found, creating new record")

      const { data: insertData, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          ...updateData,
        })
        .select()
        .single()

      if (insertError) {
        console.error("❌ [API] Error creating user record:", insertError)
        return NextResponse.json(
          { error: "Failed to create user record", details: insertError.message },
          { status: 500 },
        )
      }

      result = insertData
      console.log("✅ [API] User record created successfully:", result)
    } else {
      // ユーザーレコードが存在する場合は更新
      console.log("🔧 [API] User record found, updating existing record")

      const { data: updateResult, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single()

      if (updateError) {
        console.error("❌ [API] Error updating user record:", updateError)
        return NextResponse.json(
          { error: "Failed to update user record", details: updateError.message },
          { status: 500 },
        )
      }

      result = updateResult
      console.log("✅ [API] User record updated successfully:", result)
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("❌ [API] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
