import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SurveyResponse } from "@/lib/survey/constants"

export async function POST(request: NextRequest) {
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

    const body: SurveyResponse = await request.json()

    // Validate required fields
    if (!body.q1_primary || !body.q2_values?.length || !body.q3_features?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert survey response
    const { data, error } = await supabase
      .from("matching_survey_responses")
      .insert({
        user_id: session.user.id,
        q1_primary: body.q1_primary,
        q2_values: body.q2_values,
        q3_features: body.q3_features,
        q4_intent: body.q4_intent || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Survey insert error:", error)

      // Handle unique constraint violation (user already responded)
      if (error.code === "23505") {
        return NextResponse.json({ error: "Survey already completed" }, { status: 409 })
      }

      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Survey submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
