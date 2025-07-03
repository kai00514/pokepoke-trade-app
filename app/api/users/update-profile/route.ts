import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

// サーバーサイドSupabaseクライアント（サービスロールキー使用）
function createServerClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Server Supabase environment variables are not set")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 [API] POST /api/users/update-profile called")

    const body = await request.json()
    const { userId, profileData } = body

    console.log("🔧 [API] Request data:", { userId, profileData })

    if (!userId || !profileData) {
      return NextResponse.json({ error: "userId and profileData are required" }, { status: 400 })
    }

    // サーバーサイドクライアントでデータを更新
    const supabase = createServerClient()

    const { data, error } = await supabase.from("users").update(profileData).eq("id", userId).select().single()

    if (error) {
      console.error("❌ [API] Database error:", error)
      return NextResponse.json({ error: "Database update failed", details: error.message }, { status: 500 })
    }

    console.log("✅ [API] Update successful:", data)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ [API] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
