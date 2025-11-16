import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"
import { uploadCollageImage } from "@/lib/actions/upload-collage-image"

export const runtime = "nodejs" // Using nodejs runtime for image generation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title1, card_ids_1, title2, card_ids_2 } = body

    // Validate input
    if (!title1 || !Array.isArray(card_ids_1) || !title2 || !Array.isArray(card_ids_2)) {
      return NextResponse.json({ success: false, error: "Missing or invalid required fields" }, { status: 400 })
    }

    if (card_ids_1.length === 0 && card_ids_2.length === 0) {
      return NextResponse.json({ success: false, error: "At least one group must have cards" }, { status: 400 })
    }

    if (card_ids_1.length > 30 || card_ids_2.length > 30) {
      return NextResponse.json({ success: false, error: "Maximum 30 cards per group" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Fetch card details
    const allCardIds = [...card_ids_1, ...card_ids_2]
    const { data: cardsData, error: cardsError } = await supabase
      .from("cards")
      .select("id, name, image_url")
      .in("id", allCardIds)
      .eq("is_visible", true)

    if (cardsError || !cardsData) {
      console.error("Error fetching cards:", cardsError)
      return NextResponse.json({ success: false, error: "Failed to fetch card data" }, { status: 500 })
    }

    // Create collage record
    const collageId = uuidv4()
    const { error: insertError } = await supabase.from("user_collages").insert({
      id: collageId,
      user_id: session.user.id,
      title1: title1.trim(),
      card_ids_1: card_ids_1,
      title2: title2.trim(),
      card_ids_2: card_ids_2,
    })

    if (insertError) {
      console.error("Error creating collage:", insertError)
      return NextResponse.json({ success: false, error: "Failed to create collage" }, { status: 500 })
    }

    console.log("[POST /api/collages/generate] ✅ Collage created:", collageId)

    try {
      // 新しいImageResponseベースのAPIから画像を生成
      const imageApiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/collages/image?id=${collageId}`

      const imageResponse = await fetch(imageApiUrl)

      if (imageResponse.ok) {
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
        const uploadResult = await uploadCollageImage(imageBuffer, collageId)

        if (uploadResult.success && uploadResult.url) {
          await supabase
            .from("user_collages")
            .update({
              collage_image_url: uploadResult.url,
              collage_storage_path: uploadResult.path,
            })
            .eq("id", collageId)

          console.log("[POST /api/collages/generate] ✅ Image uploaded:", uploadResult.url)
        } else {
          console.error("[POST /api/collages/generate] ⚠️ Image upload failed:", uploadResult.error)
        }
      } else {
        console.error("[POST /api/collages/generate] ⚠️ Image generation failed:", imageResponse.status)
      }
    } catch (imageError) {
      console.error("[POST /api/collages/generate] ⚠️ Image generation failed:", imageError)
      // Continue without image - can be generated later
    }

    return NextResponse.json({
      success: true,
      id: collageId,
      collage_url: `/collages/${collageId}`,
      og_image_url: `/collages/${collageId}/opengraph-image`,
    })
  } catch (error) {
    console.error("[POST /api/collages/generate] Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
