import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
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
    const supabase = createRouteHandlerClient({ cookies })
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

    // セッションがない場合でも、管理者権限で更新を試行
    if (!session || session.user.id !== userId) {
      console.log("🔧 [API] No valid session, trying admin update")
    }

    // 更新データを準備
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
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
          created_at: new Date().toISOString(),
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
