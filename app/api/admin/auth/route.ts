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

    // authenticate_admin RPC関数を呼び出し
    const { data, error } = await supabase.rpc("authenticate_admin", {
      input_username: username,
      input_password: password,
    })

    if (error) {
      console.error("Authentication error:", error)
      return NextResponse.json({ success: false, error: "認証に失敗しました" }, { status: 500 })
    }

    if (!data || !data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data?.message || "ユーザー名またはパスワードが正しくありません",
        },
        { status: 401 },
      )
    }

    // セッションCookieを設定
    const sessionData = {
      userId: data.user_id,
      username: data.username,
      email: data.email,
      name: data.name,
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
        username: data.username,
        email: data.email,
        name: data.name,
      },
    })
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
