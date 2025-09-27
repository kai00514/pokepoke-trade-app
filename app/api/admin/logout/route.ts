import { NextResponse } from "next/server"

const SESSION_COOKIE_NAME = "admin_session"

export async function POST() {
  try {
    console.log("Admin logout request received")

    const response = NextResponse.json({ success: true })

    // Cookieを削除
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    })

    console.log("Admin session cookie cleared")
    return response
  } catch (error) {
    console.error("Admin logout error:", error)
    return NextResponse.json({ error: "ログアウトに失敗しました" }, { status: 500 })
  }
}
