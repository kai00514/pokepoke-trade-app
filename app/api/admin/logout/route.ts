import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const SESSION_COOKIE_NAME = "admin_session"

export async function POST() {
  try {
    const cookieStore = await cookies()

    // セッションCookieを削除
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "ログアウトに失敗しました" }, { status: 500 })
  }
}
