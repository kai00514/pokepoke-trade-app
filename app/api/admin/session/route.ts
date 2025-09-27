import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const SESSION_COOKIE_NAME = "admin_session"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return NextResponse.json({ session: null })
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value)

      // セッション有効期限チェック（8時間）
      const loginTime = new Date(sessionData.loginTime)
      const now = new Date()
      const diffHours = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)

      if (diffHours > 8) {
        // セッション期限切れ - レスポンスでCookie削除
        const response = NextResponse.json({ session: null })
        response.cookies.set(SESSION_COOKIE_NAME, "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 0,
          path: "/",
        })
        return response
      }

      return NextResponse.json({
        session: {
          user: {
            userId: sessionData.userId,
            username: sessionData.username,
            email: sessionData.email,
            name: sessionData.name,
          },
        },
      })
    } catch (parseError) {
      console.error("Session parse error:", parseError)
      return NextResponse.json({ session: null })
    }
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ session: null })
  }
}
