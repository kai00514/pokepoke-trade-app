import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { q1_primary, q2_values, q3_features, q4_intent } = body

    // バリデーション
    if (
      !q1_primary ||
      !q2_values ||
      !Array.isArray(q2_values) ||
      q2_values.length === 0 ||
      !q3_features ||
      !Array.isArray(q3_features) ||
      q3_features.length === 0
    ) {
      return NextResponse.json({ error: "未回答の項目があります。" }, { status: 400 })
    }

    const validQ1Values = ["want_match", "offer_match", "facet_search", "direct_specify"]
    const validQ2Values = ["speed", "trust", "rare_efficiency", "social"]
    const validQ3Values = ["chat", "notify", "review", "history"]

    if (!validQ1Values.includes(q1_primary)) {
      return NextResponse.json({ error: "Invalid Q1 value" }, { status: 400 })
    }

    if (!q2_values.every((val: string) => validQ2Values.includes(val))) {
      return NextResponse.json({ error: "Invalid Q2 values" }, { status: 400 })
    }

    if (!q3_features.every((val: string) => validQ3Values.includes(val))) {
      return NextResponse.json({ error: "Invalid Q3 values" }, { status: 400 })
    }

    if (q4_intent !== null && q4_intent !== undefined && (q4_intent < 1 || q4_intent > 5)) {
      return NextResponse.json({ error: "Invalid Q4 value" }, { status: 400 })
    }

    const { error } = await supabase.from("matching_survey_responses").insert({
      user_id: user.id,
      q1_primary,
      q2_values,
      q3_features,
      q4_intent: q4_intent || null,
    })

    if (error) {
      if (error.code === "23505") {
        // unique constraint violation
        return NextResponse.json({ error: "Already submitted" }, { status: 409 })
      }
      console.error("Survey insert error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Survey submission error:", error)
    return NextResponse.json(
      { error: "送信中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 },
    )
  }
}
