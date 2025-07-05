import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, profileData } = body

    console.log("🔧 [API] update-profile POST:", { userId, profileData })

    if (!userId || !profileData) {
      return NextResponse.json({ error: "Missing userId or profileData" }, { status: 400 })
    }

    const supabase = createClient()

    // セッション確認
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("❌ [API] Session error:", sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 401 })
    }

    if (!session?.user) {
      console.error("❌ [API] No session")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (session.user.id !== userId) {
      console.error("❌ [API] User ID mismatch")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // プロファイル更新
    const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

    if (error) {
      console.error("❌ [API] Update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    console.log("✅ [API] Profile updated:", data)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("❌ [API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
