import { type NextRequest, NextResponse } from "next/server"

const SESSION_COOKIE_NAME = "admin_session"

export async function GET(request: NextRequest) {
  try {
    console.log("Session check request received")

    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value
    console.log("Session ID from cookie:", sessionId ? "[EXISTS]" : "none")

    if (!sessionId) {
      console.log("No session cookie found")
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // 簡易セッション管理（実際のプロダクションではRedisなどを使用）
    // ここでは一時的にCookieの存在のみでセッションを判定
    console.log("Session valid")

    return NextResponse.json({
      authenticated: true,
      user: {
        username: "admin", // 実際の実装では適切なユーザー情報を返す
      },
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
