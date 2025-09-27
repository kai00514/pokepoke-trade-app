import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SESSION_COOKIE_NAME = "admin_session"

export async function POST(request: NextRequest) {
  try {
    console.log("Admin auth request received")

    const { username, password } = await request.json()
    console.log("Username:", username, "Password:", password ? "[MASKED]" : "empty")

    if (!username || !password) {
      console.log("Missing credentials")
      return NextResponse.json({ error: "ユーザー名とパスワードが必要です" }, { status: 400 })
    }

    const supabase = await createClient()
    console.log("Supabase client created")

    // RPC関数を使用して認証
    const { data: authResult, error: authError } = await supabase.rpc("authenticate_admin_user", {
      input_username: username,
      input_password: password,
    })

    console.log("RPC auth result:", authResult, "Error:", authError)

    if (authError) {
      console.error("Database authentication error:", authError)
      return NextResponse.json({ error: "データベースエラーが発生しました" }, { status: 500 })
    }

    if (!authResult || authResult.length === 0) {
      console.log("Authentication failed - no user found")
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 })
    }

    const user = authResult[0]
    console.log("Authentication successful for user:", user.username)

    // セッションIDを生成
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8時間

    // Cookieを設定
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
    })

    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    })

    console.log("Session cookie set, redirecting to admin")
    return response
  } catch (error) {
    console.error("Admin auth error:", error)
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
