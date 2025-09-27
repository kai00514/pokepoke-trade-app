import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const SESSION_COOKIE_NAME = "admin_session"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    console.log("Login attempt:", { username, password: "***" })

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "ユーザー名とパスワードを入力してください" }, { status: 400 })
    }

    const supabase = await createClient()

    // admin_usersテーブルから直接チェック
    console.log("Querying admin_users table...")
    const { data: adminUsers, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .eq("is_active", true)

    console.log("Database query result:", { adminUsers, error })

    if (error) {
      console.error("Database query error:", error)
      return NextResponse.json({ success: false, error: "データベースエラーが発生しました" }, { status: 500 })
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log("No admin user found")
      return NextResponse.json(
        { success: false, error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 },
      )
    }

    const adminUser = adminUsers[0]
    console.log("Found admin user:", { username: adminUser.username, password_hash: adminUser.password_hash })

    // パスワードチェック
    if (adminUser.password_hash !== password) {
      console.log("Password mismatch")
      return NextResponse.json(
        { success: false, error: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 },
      )
    }

    console.log("Authentication successful")

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
