import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin, createAdminSession } from "@/lib/auth/admin-session"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "ユーザー名とパスワードを入力してください" }, { status: 400 })
    }

    const user = await authenticateAdmin(username, password)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "ユーザー名またはパスワードが正しくありません" },
        { status: 401 },
      )
    }

    // セッション作成
    await createAdminSession(user)

    return NextResponse.json({
      success: true,
      message: "ログインしました",
      user: {
        username: user.username,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, message: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
