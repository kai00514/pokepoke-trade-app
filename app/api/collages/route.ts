import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : 20
    const offset = searchParams.get("offset") ? Number.parseInt(searchParams.get("offset") as string) : 0

    const supabase = await createServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 })
    }

    const userId = session.user.id

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
        image_url: c.collage_image_url || null,
        created_at: new Date(c.created_at).toLocaleDateString(),
      })) || []

    return NextResponse.json({
      success: true,
      data: {
        collages: formattedCollages,
        total: totalCount || 0,
      },
    })
  } catch (error) {
    console.error("[GET /api/collages] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
