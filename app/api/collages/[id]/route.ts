import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { deleteCollageImage } from "@/lib/actions/upload-collage-image"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const supabase = await createServerClient()

    const { data: collage, error } = await supabase.from("user_collages").select("*").eq("id", id).single()

    if (error || !collage) {
      return NextResponse.json({ success: false, error: "Collage not found" }, { status: 404 })
    }

    const allCardIds = [...(collage.card_ids_1 || []), ...(collage.card_ids_2 || [])]

    const { data: cardsData } = await supabase
      .from("cards")
      .select("id, name, image_url, type_code, rarity_code")
      .in("id", allCardIds)

    const cardsMap = new Map()
    cardsData?.forEach((card: any) => {
      cardsMap.set(card.id, card)
    })

    const cards1 = (collage.card_ids_1 || []).map((cardId: number) => {
      const cardData = cardsMap.get(cardId)
      return {
        id: cardId?.toString() || "unknown",
        name: cardData?.name || "不明",
        imageUrl: cardData?.image_url || "/placeholder.svg?width=80&height=112",
      }
    })

    const cards2 = (collage.card_ids_2 || []).map((cardId: number) => {
      const cardData = cardsMap.get(cardId)
      return {
        id: cardId?.toString() || "unknown",
        name: cardData?.name || "不明",
        imageUrl: cardData?.image_url || "/placeholder.svg?width=80&height=112",
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: collage.id,
        title1: collage.title1,
        title2: collage.title2,
        card_ids_1: collage.card_ids_1,
        card_ids_2: collage.card_ids_2,
        cards1,
        cards2,
        image_url: collage.collage_image_url || null,
        created_at: collage.created_at,
      },
    })
  } catch (error) {
    console.error("[GET /api/collages/[id]] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const supabase = await createServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 })
    }

    const userId = session.user.id

    // Verify ownership and get storage path
    const { data: collage } = await supabase
      .from("user_collages")
      .select("user_id, collage_storage_path")
      .eq("id", id)
      .single()

    if (!collage || collage.user_id !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Delete from Storage if exists
    if (collage.collage_storage_path) {
      await deleteCollageImage(collage.collage_storage_path)
    }

    // Delete from database
    const { error } = await supabase.from("user_collages").delete().eq("id", id)

    if (error) {
      console.error("[DELETE /api/collages/[id]] Delete error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/collages/[id]] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
