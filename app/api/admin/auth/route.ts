import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const SESSION_COOKIE_NAME = "admin_session"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "ユーザー名とパスワードを入力してください" }, { status: 400 })
    }

    const supabase = await createClient()

    // RPC関数を使用して認証
    const { data: authResult, error: authError } = await supabase.rpc("authenticate_admin_user", {
      input_username: username,
      input_password: password,
    })

    if (authError) {
      console.error("Database authentication error:", authError)
      return NextResponse.json({ success: false, error: "データベースエラーが発生しました" }, { status: 500 })
    }

    if (!authResult || authResult.length === 0) {
      return NextResponse.json({ success: false, error: "認証に失敗しました" }, { status: 401 })
    }

    const user = authResult[0]

    // セッション��ータをCookieに保存
    const sessionData = {
      userId: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      loginTime: new Date().toISOString(),
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8時間
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
