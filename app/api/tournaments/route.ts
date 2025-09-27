import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current date in YYYY-MM-DD format for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayString = today.toISOString()

    // Fetch published tournaments that are today or in the future
    const { data: tournaments, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("is_published", true)
      .gte("event_date", todayString)
      .order("event_date", { ascending: true })

    if (error) {
      console.error("Tournament fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 })
    }

    return NextResponse.json(tournaments || [])
  } catch (error) {
    console.error("Tournament API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
