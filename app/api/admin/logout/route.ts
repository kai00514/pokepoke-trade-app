import { NextResponse } from "next/server"
import { clearAdminSession } from "@/lib/auth/admin-session"

export async function POST() {
  try {
    await clearAdminSession()

    return NextResponse.json({
      success: true,
      message: "ログアウトしました",
    })
  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json({ success: false, message: "ログアウトに失敗しました" }, { status: 500 })
  }
}
