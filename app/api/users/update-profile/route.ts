import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("🔧 [API] /api/users/update-profile - Request received")

  try {
    const { userId, profileData } = await request.json()
    console.log("🔧 [API] Request data:", { userId, profileData })

    if (!userId || !profileData) {
      console.error("❌ [API] Missing required fields")
      return NextResponse.json({ error: "Missing userId or profileData" }, { status: 400 })
    }

    // サーバーサイドSupabaseクライアントを作成
    const supabase = createRouteHandlerClient({ cookies })
    console.log("🔧 [API] Supabase client created")

    // 現在のユーザーを確認
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("❌ [API] Authentication error:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔧 [API] Authenticated user:", { id: user.id, email: user.email })

    // ユーザーIDの一致を確認
    if (user.id !== userId) {
      console.error("❌ [API] User ID mismatch:", {
        authenticatedUserId: user.id,
        requestedUserId: userId,
      })
      return NextResponse.json({ error: "Forbidden: User ID mismatch" }, { status: 403 })
    }

    // 更新データを準備
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    console.log("🔧 [API] Update data prepared:", updateData)

    // 既存のユーザーレコードを確認
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (selectError && selectError.code !== "PGRST116") {
      console.error("❌ [API] Error checking existing user:", selectError)
      return NextResponse.json({ error: "Database error", details: selectError.message }, { status: 500 })
    }

    let result

    if (!existingUser) {
      // ユーザーレコードが存在しない場合は作成
      console.log("🔧 [API] User record not found, creating new record")
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          ...updateData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error("❌ [API] Error creating user:", insertError)
        return NextResponse.json({ error: "Failed to create user", details: insertError.message }, { status: 500 })
      }

      result = newUser
      console.log("✅ [API] User created successfully:", result)
    } else {
      // 既存のユーザーレコードを更新
      console.log("🔧 [API] Updating existing user record")
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select()
        .single()

      if (updateError) {
        console.error("❌ [API] Error updating user:", updateError)
        return NextResponse.json({ error: "Failed to update user", details: updateError.message }, { status: 500 })
      }

      result = updatedUser
      console.log("✅ [API] User updated successfully:", result)
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
