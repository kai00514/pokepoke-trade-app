import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("🔧 [API] /api/users/update-profile - START")

    // リクエストボディを解析
    const body = await request.json()
    const { userId, profileData } = body

    console.log("🔧 [API] Request data:", { userId, profileData })

    if (!userId || !profileData) {
      console.error("❌ [API] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // サーバーサイドのSupabaseクライアントを作成
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // セッション確認
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("🔧 [API] Session check:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      requestedUserId: userId,
    })

    // セッションユーザーIDと一致するか確認
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

    // 更新実行
    console.log("🔧 [API] Executing update query...")
    const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

    if (error) {
      console.error("❌ [API] Update error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ [API] Update successful:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ [API] Unhandled error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
