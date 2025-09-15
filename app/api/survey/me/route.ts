import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    // Check if user has already responded to survey
    const { data, error } = await supabase
      .from("matching_survey_responses")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Survey check error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({
      hasResponded: !!data,
    })
  } catch (error) {
    console.error("Survey check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
