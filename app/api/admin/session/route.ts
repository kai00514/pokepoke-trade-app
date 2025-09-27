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

    const sessionData = JSON.parse(sessionCookie.value)

    return NextResponse.json({
      session: {
        user: {
          username: sessionData.username,
          email: sessionData.email,
          name: sessionData.name,
        },
        expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8時間後
      },
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ session: null })
  }
}
