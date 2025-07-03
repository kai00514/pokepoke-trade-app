import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("🔧 [API] update-profile called")

  try {
    const { userId, profileData } = await request.json()
    console.log("🔧 [API] Input userId:", userId)
    console.log("🔧 [API] Input profileData:", profileData)

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // 現在のユーザーを確認
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("🔧 [API] Authentication error:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("🔧 [API] Authenticated user:", user.id)

    // ユーザーIDが一致するかチェック
    if (user.id !== userId) {
      console.error("🔧 [API] User ID mismatch")
      return NextResponse.json({ error: "Forbidden: Cannot update other user profiles" }, { status: 403 })
    }

    // まず、ユーザーが存在するかチェック
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    console.log("🔧 [API] Existing user check:", { existingUser, selectError })

    let result
    if (selectError && selectError.code === "PGRST116") {
      // ユーザーが存在しない場合は作成
      console.log("🔧 [API] Creating new user record")
      const { data: insertData, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: user.email,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (insertError) {
        console.error("🔧 [API] Insert error:", insertError)
        return NextResponse.json({ error: "Failed to create user profile", details: insertError }, { status: 500 })
      }

      result = insertData
      console.log("🔧 [API] User created successfully:", result)
    } else if (selectError) {
      console.error("🔧 [API] Select error:", selectError)
      return NextResponse.json({ error: "Failed to check user existence", details: selectError }, { status: 500 })
    } else {
      // ユーザーが存在する場合は更新
      console.log("🔧 [API] Updating existing user record")
      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()

      if (updateError) {
        console.error("🔧 [API] Update error:", updateError)
        return NextResponse.json({ error: "Failed to update user profile", details: updateError }, { status: 500 })
      }

      result = updateData
      console.log("🔧 [API] User updated successfully:", result)
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("🔧 [API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
