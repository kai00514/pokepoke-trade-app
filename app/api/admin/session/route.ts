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

    const session = JSON.parse(sessionCookie.value)

    // セッション有効期限チェック
    if (Date.now() > session.expiresAt) {
      cookieStore.delete(SESSION_COOKIE_NAME)
      return NextResponse.json({ session: null })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ session: null })
  }
}
