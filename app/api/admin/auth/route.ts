import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

const SESSION_COOKIE_NAME = "admin_session"
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8時間

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // 管理者認証
    const { data, error } = await supabase.rpc("authenticate_admin", {
      p_username: username,
      p_password: password,
    })

    if (error) {
      console.error("Authentication error:", error)
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
    }

    if (!data?.success) {
      const errorMessage =
        data?.error === "account_locked"
          ? "Account is temporarily locked due to multiple failed attempts"
          : "Invalid username or password"

      return NextResponse.json({ success: false, error: errorMessage }, { status: 401 })
    }

    // セッション作成
    const session = {
      user: data.user,
      expiresAt: Date.now() + SESSION_DURATION,
    }

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION / 1000,
      path: "/", // "/admin" から "/" に変更
    })

    return NextResponse.json({
      success: true,
      user: data.user,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
