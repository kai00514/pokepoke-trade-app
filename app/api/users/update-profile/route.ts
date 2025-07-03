import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("🔧 [API] /api/users/update-profile - Request received")

  try {
    const { userId, profileData } = await request.json()
    console.log("🔧 [API] Request data:", { userId, profileData })

    if (!userId || !profileData) {
      console.error("❌ [API] Missing required fields")
      return NextResponse.json({ error: "Missing userId or profileData" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    console.log("🔧 [API] Supabase client created")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("❌ [API] Authentication error:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.id !== userId) {
      console.error("❌ [API] User ID mismatch")
      return NextResponse.json({ error: "Forbidden: User ID mismatch" }, { status: 403 })
    }

    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("users")
      .upsert({ id: userId, ...updateData })
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Upsert error:", error)
      return NextResponse.json({ error: "Database update failed", details: error.message }, { status: 500 })
    }

    console.log("✅ [API] Upsert successful:", data)
    return NextResponse.json({
      success: true,
      data,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("❌ [API] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
