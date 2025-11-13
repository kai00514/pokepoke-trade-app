"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import type { Card } from "@/components/detailed-search-modal"

// Helper function to convert Card[] to JSONB format
function prepareCardsForDatabase(cards: Card[]) {
  return cards.map((card) => ({
    id: Number.parseInt(card.id),
    name: card.name,
    image_url: card.imageUrl,
    pack_name: card.packName || null,
    type: card.type || null,
    rarity: card.rarity || null,
  }))
}

// Helper function to convert JSONB data back to Card format
function parseCardsFromDatabase(jsonbData: any[]): Card[] {
  if (!Array.isArray(jsonbData)) return []

  return jsonbData.map((card) => ({
    id: card.id?.toString() || "unknown",
    name: card.name || "不明",
    imageUrl: card.image_url || "/placeholder.svg?width=80&height=112",
    packName: card.pack_name || undefined,
    type: card.type || undefined,
    rarity: card.rarity || undefined,
  }))
}

export interface CollageFormData {
  title1: string
  card_ids_1: number[]
  title2: string
  card_ids_2: number[]
}

export async function createCollage(userId: string, formData: CollageFormData) {
  try {
    console.log("[createCollage] 🚀 Starting collage creation...")
    console.log("[createCollage] Form data:", {
      title1: formData.title1,
      cards1Count: formData.card_ids_1.length,
      title2: formData.title2,
      cards2Count: formData.card_ids_2.length,
      userId,
    })

    const supabase = await createServerClient()

    // Validate input
    if (!formData.title1.trim() || formData.card_ids_1.length === 0) {
      return { success: false, error: "タイトル1とカード1は必須です。" }
    }

    if (!formData.title2.trim() || formData.card_ids_2.length === 0) {
      return { success: false, error: "タイトル2とカード2は必須です。" }
    }

    // Prepare card data
    const cardsData1 = formData.card_ids_1.map((id) => ({ id }))
    const cardsData2 = formData.card_ids_2.map((id) => ({ id }))

    // Create collage record
    const collageId = uuidv4()
    const insertData = {
      id: collageId,
      user_id: userId,
      title1: formData.title1.trim(),
      card_ids_1: cardsData1,
      title2: formData.title2.trim(),
      card_ids_2: cardsData2,
    }

    console.log("[createCollage] Insert data:", {
      ...insertData,
      card_ids_1: `[${formData.card_ids_1.length} cards]`,
      card_ids_2: `[${formData.card_ids_2.length} cards]`,
    })

    const { data: result, error: insertError } = await supabase
      .from("user_collages")
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error("[createCollage] Insert error:", insertError)
      return {
        success: false,
        error: `コラージュの作成に失敗しました: ${insertError.message}`,
      }
    }

    console.log("[createCollage] ✅ Collage inserted successfully!")

    revalidatePath("/collages")

    return {
      success: true,
      collageId,
      collage_url: `/collages/${collageId}`,
    }
  } catch (error) {
    console.error("[createCollage] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました。",
    }
  }
}

export async function getUserCollages(userId: string, limit = 20, offset = 0) {
  try {
    console.log("[getUserCollages] 🚀 Fetching collages for user:", userId)

    const supabase = await createServerClient()

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("user_collages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) {
      console.error("[getUserCollages] Count error:", countError)
    }

    // Get collages
    const { data: collages, error: collagesError } = await supabase
      .from("user_collages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (collagesError) {
      console.error("[getUserCollages] Query error:", collagesError)
      return { success: false, error: `コラージュの取得に失敗しました: ${collagesError.message}`, collages: [] }
    }

    if (!collages || collages.length === 0) {
      return { success: true, collages: [], totalCount: 0 }
    }

    // Format collages
    const formattedCollages = collages.map((collage: any) => {
      const createdAt = new Date(collage.created_at)
      const formattedDate = `${createdAt.getFullYear()}/${String(createdAt.getMonth() + 1).padStart(
        2,
        "0",
      )}/${String(createdAt.getDate()).padStart(2, "0")}`

      return {
        id: collage.id,
        title1: collage.title1,
        title2: collage.title2,
        cardCount1: collage.card_ids_1?.length || 0,
        cardCount2: collage.card_ids_2?.length || 0,
        created_at: formattedDate,
        collage_url: `/collages/${collage.id}`,
      }
    })

    console.log("[getUserCollages] ✅ Fetched successfully:", formattedCollages.length)

    return { success: true, collages: formattedCollages, totalCount: totalCount || 0 }
  } catch (error) {
    console.error("[getUserCollages] Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました。", collages: [] }
  }
}

export async function getCollageById(collageId: string) {
  try {
    console.log("[getCollageById] 🚀 Fetching collage:", collageId)

    const supabase = await createServerClient()

    const { data: collage, error: collageError } = await supabase
      .from("user_collages")
      .select("*")
      .eq("id", collageId)
      .single()

    if (collageError || !collage) {
      console.error("[getCollageById] Query error:", collageError)
      return {
        success: false,
        error: `コラージュが見つかりません`,
        collage: null,
      }
    }

    // Get card details for both groups
    const allCardIds = [...(collage.card_ids_1 || []), ...(collage.card_ids_2 || [])].map((c: any) => c.id)

    const { data: cardsData, error: cardsError } = await supabase
      .from("cards")
      .select("id, name, image_url, pack_name, type, rarity")
      .in("id", allCardIds)

    if (cardsError) {
      console.error("[getCollageById] Cards error:", cardsError)
    }

    // Map cards by ID for quick lookup
    const cardsMap = new Map()
    cardsData?.forEach((card: any) => {
      cardsMap.set(card.id, card)
    })

    // Parse cards with full data
    const cards1 = (collage.card_ids_1 || []).map((c: any) => {
      const cardData = cardsMap.get(c.id)
      return {
        id: c.id?.toString() || "unknown",
        name: cardData?.name || "不明",
        imageUrl: cardData?.image_url || "/placeholder.svg?width=80&height=112",
        packName: cardData?.pack_name || undefined,
        type: cardData?.type || undefined,
        rarity: cardData?.rarity || undefined,
      }
    })

    const cards2 = (collage.card_ids_2 || []).map((c: any) => {
      const cardData = cardsMap.get(c.id)
      return {
        id: c.id?.toString() || "unknown",
        name: cardData?.name || "不明",
        imageUrl: cardData?.image_url || "/placeholder.svg?width=80&height=112",
        packName: cardData?.pack_name || undefined,
        type: cardData?.type || undefined,
        rarity: cardData?.rarity || undefined,
      }
    })

    const formattedCollage = {
      id: collage.id,
      title1: collage.title1,
      title2: collage.title2,
      cards1,
      cards2,
      created_at: new Date(collage.created_at).toLocaleDateString(),
    }

    console.log("[getCollageById] ✅ Fetched successfully")

    return { success: true, collage: formattedCollage }
  } catch (error) {
    console.error("[getCollageById] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました。",
      collage: null,
    }
  }
}

export async function deleteCollage(collageId: string, userId: string) {
  try {
    console.log("[deleteCollage] 🚀 Deleting collage:", collageId)

    const supabase = await createServerClient()

    // Verify ownership
    const { data: collage, error: fetchError } = await supabase
      .from("user_collages")
      .select("user_id")
      .eq("id", collageId)
      .single()

    if (fetchError || !collage) {
      return { success: false, error: "コラージュが見つかりません。" }
    }

    if (collage.user_id !== userId) {
      return { success: false, error: "このコラージュを削除する権限がありません。" }
    }

    // Delete collage
    const { error: deleteError } = await supabase.from("user_collages").delete().eq("id", collageId)

    if (deleteError) {
      console.error("[deleteCollage] Delete error:", deleteError)
      return { success: false, error: `削除に失敗しました: ${deleteError.message}` }
    }

    console.log("[deleteCollage] ✅ Deleted successfully")

    revalidatePath("/collages")

    return { success: true }
  } catch (error) {
    console.error("[deleteCollage] Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}
