"use server"

import { createClient } from "@supabase/supabase-js"
import { fetchCardDetailsByIds, type CardData } from "@/lib/card-api"

// Supabaseクライアント（deck-posts.ts と同様の作り）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * info_pages（deck_pages と同一スキーマ）一覧を取得
 * - deck-posts.ts の getDeckPagesList を踏襲
 */
export async function getInfoPagesList(options?: {
  sortBy?: "latest" | "popular" | "tier"
  category?: "tier" | "newpack" | "featured"
  limit?: number
  page?: number
}): Promise<{ success: boolean; data?: any[]; total?: number; hasMore?: boolean; error?: string }> {
  try {
    const { sortBy = "latest", category, limit = 20, page = 1 } = options || {}
    const offset = (page - 1) * limit

    let query = supabase
      .from("info_pages")
      .select(
        `
        id,
        title,
        deck_name,
        thumbnail_image_url,
        tier_rank,
        view_count,
        like_count,
        comment_count,
        updated_at,
        is_published,
        category
      `,
        { count: "exact" },
      )
      .eq("is_published", true)

    if (category) {
      query = query.eq("category", category)
    }

    query = query.range(offset, offset + limit - 1)

    switch (sortBy) {
      case "latest":
        query = query.order("updated_at", { ascending: false })
        break
      case "popular":
        query = query.order("view_count", { ascending: false })
        break
      case "tier":
        query = query.order("tier_rank", { ascending: true }).order("view_count", { ascending: false })
        break
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching info pages:", error)
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false,
      }
    }

    const total = count || 0
    const hasMore = offset + limit < total

    return {
      success: true,
      data: data || [],
      total,
      hasMore,
      error: undefined,
    }
  } catch (error) {
    console.error("Error in getInfoPagesList:", error)
    return {
      success: false,
      error: "最新情報の取得に失敗しました",
      data: [],
      total: 0,
      hasMore: false,
    }
  }
}

/**
 * info_pages から個別の記事ページを取得
 * - deck-posts.ts の getDeckPageById を踏襲
 * - deck_cards の整形とカード詳細付与（cards_data）を実施
 * - view_count を非同期で +1
 */
export async function getInfoPageById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.from("info_pages").select("*").eq("id", id).eq("is_published", true).single()

    if (error) {
      if ((error as any).code === "PGRST116") {
        return { success: false, error: "記事が見つかりません", data: null }
      }
      return { success: false, error: (error as any).message, data: null }
    }

    // ビュー数を増加（非同期、エラー無視）
    supabase
      .from("info_pages")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.warn("Failed to update info_pages view count:", error)
        }
      })

    // deck_cards の処理（文字列/配列/オブジェクトに対応）
    let cardsData: any[] = []
    if (data.deck_cards) {
      if (typeof data.deck_cards === "string") {
        try {
          cardsData = JSON.parse(data.deck_cards)
        } catch (parseError) {
          console.error("Failed to parse info_pages.deck_cards as JSON:", parseError)
          cardsData = []
        }
      } else if (Array.isArray(data.deck_cards)) {
        cardsData = data.deck_cards
      } else if (typeof data.deck_cards === "object") {
        cardsData = Object.values(data.deck_cards).filter((item) => item && typeof item === "object")
      }
    }

    // カード詳細の付与（cards_data を生成）
    if (Array.isArray(cardsData) && cardsData.length > 0) {
      const cardIds = cardsData.map((card: any) => card.card_id?.toString()).filter(Boolean)
      if (cardIds.length > 0) {
        const cardDetails = await fetchCardDetailsByIds(cardIds)

        const cardDetailsMap = new Map<number, CardData>()
        cardDetails.forEach((detail) => {
          cardDetailsMap.set(detail.id, detail)
        })

        data.cards_data = cardsData.map((card: any) => {
          const detail = cardDetailsMap.get(card.card_id)
          return {
            card_id: card.card_id,
            quantity: card.card_count || card.quantity || 1,
            name: detail?.name || "不明なカード",
            image_url: detail?.image_url || "/placeholder.svg?height=100&width=70",
            thumb_url: detail?.thumb_url || detail?.image_url || "/placeholder.svg?height=100&width=70",
            pack_name: card.pack_name || "不明なパック",
            display_order: card.display_order || 0,
          }
        })
      } else {
        data.cards_data = []
      }
    } else {
      data.cards_data = []
    }

    return { success: true, data, error: undefined }
  } catch (error) {
    console.error("Error in getInfoPageById:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の取得に失敗しました",
      data: null,
    }
  }
}
