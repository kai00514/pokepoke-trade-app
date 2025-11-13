"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CollageFormData {
  title1: string
  card_ids_1: number[]
  title2: string
  card_ids_2: number[]
}

export async function createCollage(userId: string, formData: CollageFormData) {
  try {
    console.log("[v0] [createCollage] Starting collage creation...")
    console.log("[v0] Form data:", {
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

    const insertData = {
      user_id: userId,
      title1: formData.title1.trim(),
      card_ids_1: formData.card_ids_1, // Direct number array
      title2: formData.title2.trim(),
      card_ids_2: formData.card_ids_2, // Direct number array
    }

    console.log("[v0] Insert data:", {
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
      console.error("[v0] Insert error:", insertError)
      return {
        success: false,
        error: `コラージュの作成に失敗しました: ${insertError.message}`,
      }
    }

    console.log("[v0] Collage inserted successfully!")

    revalidatePath("/collages")

    return {
      success: true,
      collageId: result.id,
      collage_url: `/collages/${result.id}`,
    }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました。",
    }
  }
}

export async function getUserCollages(userId: string, limit = 20, offset = 0) {
  try {
    console.log("[v0] [getUserCollages] Fetching collages for user:", userId)

    const supabase = await createServerClient()

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("user_collages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) {
      console.error("[v0] Count error:", countError)
    }

    // Get collages
    const { data: collages, error: collagesError } = await supabase
      .from("user_collages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (collagesError) {
      console.error("[v0] Query error:", collagesError)
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
        cardCount1: Array.isArray(collage.card_ids_1) ? collage.card_ids_1.length : 0,
        cardCount2: Array.isArray(collage.card_ids_2) ? collage.card_ids_2.length : 0,
        created_at: formattedDate,
        collage_url: `/collages/${collage.id}`,
      }
    })

    console.log("[v0] Fetched successfully:", formattedCollages.length)

    return { success: true, collages: formattedCollages, totalCount: totalCount || 0 }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました。", collages: [] }
  }
}

export async function getCollageById(collageId: string) {
  try {
    console.log("[v0] [getCollageById] Fetching collage:", collageId)

    const supabase = await createServerClient()

    const { data: collage, error: collageError } = await supabase
      .from("user_collages")
      .select("*")
      .eq("id", collageId)
      .single()

    if (collageError || !collage) {
      console.error("[v0] Query error:", collageError)
      return {
        success: false,
        error: `コラージュが見つかりません`,
        collage: null,
      }
    }

    const cardIds1 = Array.isArray(collage.card_ids_1) ? collage.card_ids_1 : []
    const cardIds2 = Array.isArray(collage.card_ids_2) ? collage.card_ids_2 : []
    const allCardIds = [...cardIds1, ...cardIds2]

    const { data: cardsData, error: cardsError } = await supabase
      .from("cards")
      .select("id, name, image_url, type_code, rarity_code")
      .in("id", allCardIds)

    if (cardsError) {
      console.error("[v0] Cards error:", cardsError)
    }

    // Map cards by ID for quick lookup
    const cardsMap = new Map()
    cardsData?.forEach((card: any) => {
      cardsMap.set(card.id, card)
    })

    const cards1 = cardIds1.map((cardId: number) => {
      const cardData = cardsMap.get(cardId)
      return {
        id: cardId.toString(),
        name: cardData?.name || "不明",
        imageUrl: cardData?.image_url || "/placeholder.svg?width=80&height=112",
        type: cardData?.type_code || undefined,
        rarity: cardData?.rarity_code || undefined,
      }
    })

    const cards2 = cardIds2.map((cardId: number) => {
      const cardData = cardsMap.get(cardId)
      return {
        id: cardId.toString(),
        name: cardData?.name || "不明",
        imageUrl: cardData?.image_url || "/placeholder.svg?width=80&height=112",
        type: cardData?.type_code || undefined,
        rarity: cardData?.rarity_code || undefined,
      }
    })

    const formattedCollage = {
      id: collage.id,
      title1: collage.title1,
      title2: collage.title2,
      card_ids_1: cardIds1,
      card_ids_2: cardIds2,
      cards1,
      cards2,
      created_at: new Date(collage.created_at).toLocaleDateString(),
    }

    console.log("[v0] Fetched successfully")

    return { success: true, collage: formattedCollage }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "予期しないエラーが発生しました。",
      collage: null,
    }
  }
}

export async function deleteCollage(collageId: string, userId: string) {
  try {
    console.log("[v0] [deleteCollage] Deleting collage:", collageId)

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
      console.error("[v0] Delete error:", deleteError)
      return { success: false, error: `削除に失敗しました: ${deleteError.message}` }
    }

    console.log("[v0] Deleted successfully")

    revalidatePath("/collages")

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}
