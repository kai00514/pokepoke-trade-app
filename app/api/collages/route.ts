import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : 20
    const offset = searchParams.get("offset") ? Number.parseInt(searchParams.get("offset") as string) : 0

    if (!userId) {
      return NextResponse.json({ success: false, error: "userIdは必須です" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { count: totalCount } = await supabase
      .from("user_collages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    const { data: collages, error } = await supabase
      .from("user_collages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[GET /api/collages] Error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const formattedCollages =
      collages?.map((c: any) => ({
        id: c.id,
        title1: c.title1,
        title2: c.title2,
        cardCount1: c.card_ids_1?.length || 0,
        cardCount2: c.card_ids_2?.length || 0,
        created_at: new Date(c.created_at).toLocaleDateString(),
      })) || []

    return NextResponse.json({
      success: true,
      collages: formattedCollages,
      totalCount: totalCount || 0,
    })
  } catch (error) {
    console.error("[GET /api/collages] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title1, card_ids_1, title2, card_ids_2 } = body

    if (!userId || !title1 || !card_ids_1 || !title2 || !card_ids_2) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Verify user ownership by checking auth session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session || session.user.id !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const collageId = crypto.randomUUID()

    const { data: result, error } = await supabase
      .from("user_collages")
      .insert({
        id: collageId,
        user_id: userId,
        title1: title1.trim(),
        card_ids_1: card_ids_1, // Direct number array for bigint[]
        title2: title2.trim(),
        card_ids_2: card_ids_2, // Direct number array for bigint[]
      })
      .select()
      .single()

    if (error) {
      console.error("[POST /api/collages] Insert error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      collageId,
      collage_url: `/collages/${collageId}`,
    })
  } catch (error) {
    console.error("[POST /api/collages] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
