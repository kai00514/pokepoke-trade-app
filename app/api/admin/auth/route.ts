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

    // まずはadmin_usersテーブルから直接チェック（RPC関数を使わない）
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("Database query error:", error)
      return NextResponse.json({ success: false, error: "データベースエラーが発生しました" }, { status: 500 })
    }

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 },
      )
    }

    // パスワードチェック（簡易版 - 本来はハッシュ化すべき）
    if (adminUser.password_hash !== password) {
      return NextResponse.json(
        { success: false, error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 },
      )
    }

    // セッションCookieを設定
    const sessionData = {
      userId: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      name: adminUser.name,
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
        username: adminUser.username,
        email: adminUser.email,
        name: adminUser.name,
      },
    })
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
