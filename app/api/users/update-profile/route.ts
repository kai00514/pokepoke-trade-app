import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("🔧 [API] POST /api/users/update-profile called")

    const body = await request.json()
    const { userId, profileData } = body

    console.log("🔧 [API] Request data:", { userId, profileData })

    if (!userId || !profileData) {
      console.error("❌ [API] Missing required fields")
      return NextResponse.json({ error: "userId and profileData are required" }, { status: 400 })
    }

    // サーバーサイドのSupabaseクライアントを作成
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    console.log("🔧 [API] Supabase client created")

    // セッション確認
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    console.log("🔧 [API] Session check:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      requestedUserId: userId,
      sessionError: sessionError?.message,
    })

    if (sessionError) {
      console.error("❌ [API] Session error:", sessionError)
      return NextResponse.json({ error: "Session error", details: sessionError.message }, { status: 401 })
    }

    if (!session) {
      console.error("❌ [API] No active session")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (session.user.id !== userId) {
      console.error("❌ [API] User ID mismatch")
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 })
    }

    // 更新データの準備
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    console.log("🔧 [API] Update data prepared:", updateData)

    // 現在のデータを確認（デバッグ用）
    const { data: currentData, error: selectError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (selectError) {
      console.log("🔧 [API] Current data select error (may be normal if user doesn't exist):", selectError)
    } else {
      console.log("🔧 [API] Current user data:", currentData)
    }

    // 更新実行
    console.log("🔧 [API] Executing update query...")
    const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

    if (error) {
      console.error("❌ [API] Update error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })

      // エラーの詳細分析
      if (error.code === "PGRST116") {
        console.error("❌ [API] No rows found - user may not exist in users table")

        // ユーザーレコードを作成してから更新を試行
        console.log("🔧 [API] Attempting to create user record first...")
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
          console.error("❌ [API] Insert error:", insertError)
          return NextResponse.json(
            { error: "Failed to create user record", details: insertError.message },
            { status: 500 },
          )
        }

        console.log("✅ [API] User record created successfully:", insertData)
        return NextResponse.json({ success: true, data: insertData })
      }

      return NextResponse.json({ error: "Database update failed", details: error.message }, { status: 500 })
    }

    console.log("✅ [API] Update successful:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ [API] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
