"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface DeckPageData {
  title: string
  deck_name: string
  deck_description?: string
  deck_badge?: string
  thumbnail_image_url?: string
  thumbnail_alt?: string
  section1_title?: string
  section2_title?: string
  section3_title?: string
  category: string
  energy_type?: string
  evaluation_title?: string
  tier_rank: string
  tier_name?: string
  tier_descriptions: string[]
  is_published: boolean
  stats: {
    accessibility: number
    speed: number
    power: number
    durability: number
    stability: number
  }
  strengths_weaknesses_list: string[]
  how_to_play_list: string[]
  deck_cards: Array<{
    card_id: number
    card_count: number
    display_order: number
  }>
  strengths_weaknesses: Array<{
    title: string
    description: string
    image_urls: string[]
    display_order: number
  }>
  play_steps: Array<{
    step_number: number
    title: string
    description: string
    image_urls: string[]
  }>
}

export async function createDeckPage(deckData: DeckPageData) {
  console.log("[SERVER] === DEBUG: createDeckPage function started ===")
  console.log("[SERVER] Input deck data:", JSON.stringify(deckData, null, 2))

  try {
    const supabase = await createClient()

    // 現在のユーザーを取得（認証確認のため）
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[SERVER] === DEBUG: Current user info ===")
    console.log("[SERVER] User ID:", user?.id)
    console.log("[SERVER] User error:", userError)

    if (userError) {
      console.log("[SERVER] ERROR: User authentication error:", userError)
      throw new Error("認証エラーが発生しました")
    }

    if (!user) {
      console.log("[SERVER] ERROR: No authenticated user found")
      throw new Error("認証されていません")
    }

    // デッキカードの枚数検証
    const totalCards = deckData.deck_cards.reduce((sum, card) => sum + card.card_count, 0)
    if (totalCards !== 20) {
      throw new Error(`デッキはちょうど20枚である必要があります。(現在: ${totalCards}枚)`)
    }

    // 各カードの枚数制限チェック
    const invalidCards = deckData.deck_cards.filter((card) => card.card_count < 1 || card.card_count > 2)
    if (invalidCards.length > 0) {
      throw new Error("同じカードは1〜2枚までです。")
    }

    // deck_cardsをJSON形式に変換（実際のDB構造に合わせて修正）
    const deckCardsWithPackNames = await Promise.all(
      deckData.deck_cards.map(async (card) => {
        // カード情報からpack_nameを取得
        const { data: cardInfo } = await supabase.from("cards").select("pack_id").eq("id", card.card_id).single()

        let packName = "不明なパック"
        if (cardInfo?.pack_id) {
          const { data: packInfo } = await supabase.from("packs").select("name").eq("id", cardInfo.pack_id).single()
          packName = packInfo?.name || "不明なパック"
        }

        return {
          card_id: card.card_id,
          pack_name: packName,
          card_count: card.card_count, // quantityではなくcard_count
          display_order: card.display_order,
        }
      }),
    )

    // strengths_weaknesses_detailsをJSON文字列形式に変換（HTMLタグ対応）
    const strengthsWeaknessesDetailsJson = JSON.stringify(
      deckData.strengths_weaknesses.map((item) => ({
        title: item.title,
        description: item.description, // HTMLタグをそのまま保持
        image_urls: item.image_urls,
        display_order: item.display_order,
      })),
    )

    // how_to_play_stepsをJSON文字列形式に変換（HTMLタグ対応）
    const howToPlayStepsJson = JSON.stringify(
      deckData.play_steps.map((step) => ({
        title: step.title,
        description: step.description, // HTMLタグをそのまま保持
        image_urls: step.image_urls,
        step_number: step.step_number,
      })),
    )

    // サムネイル画像URLを設定
    let thumbnailImageUrl = deckData.thumbnail_image_url || "/placeholder.svg?height=400&width=600"
    if (!deckData.thumbnail_image_url && deckData.deck_cards.length > 0) {
      // デフォルト画像を設定
      thumbnailImageUrl = `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(deckData.deck_name)}`
    }

    // デッキページデータの準備（実際のDB構造に合わせて修正）
    const insertData = {
      title: deckData.title,
      deck_name: deckData.deck_name,
      deck_description: deckData.deck_description || null,
      deck_badge: deckData.deck_badge || null,
      thumbnail_image_url: thumbnailImageUrl,
      thumbnail_alt: deckData.thumbnail_alt || null,
      section1_title: deckData.section1_title || "デッキ概要",
      section2_title: deckData.section2_title || "強み・弱み",
      section3_title: deckData.section3_title || "デッキの回し方",
      category: deckData.category as any, // deck_category enum
      energy_type: deckData.energy_type || "無色",
      energy_image_url: null, // 必要に応じて設定
      evaluation_title: deckData.evaluation_title || "デッキ評価",
      tier_rank: deckData.tier_rank,
      tier_name: deckData.tier_name || "Tier1",
      tier_descriptions: deckData.tier_descriptions.filter((desc) => desc.trim()),
      is_published: deckData.is_published,
      stat_accessibility: deckData.stats.accessibility,
      stat_speed: deckData.stats.speed,
      stat_power: deckData.stats.power,
      stat_durability: deckData.stats.durability,
      stat_stability: deckData.stats.stability,
      strengths_weaknesses_list: deckData.strengths_weaknesses_list.filter((item) => item.trim()),
      how_to_play_list: deckData.how_to_play_list.filter((item) => item.trim()),
      deck_cards: JSON.stringify(deckCardsWithPackNames), // JSON文字列として格納
      strengths_weaknesses_details: strengthsWeaknessesDetailsJson, // JSON文字列として格納
      how_to_play_steps: howToPlayStepsJson, // JSON文字列として格納
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      favorite_count: 0,
      eval_value: "0.00", // 文字列として格納
      eval_count: 0,
    }

    console.log("[SERVER] === DEBUG: Prepared insert data ===")
    console.log("[SERVER] Insert data:", JSON.stringify(insertData, null, 2))

    // デッキページを挿入
    console.log("[SERVER] === DEBUG: Inserting deck page ===")
    const { data: deckPage, error: deckPageError } = await supabase
      .from("deck_pages")
      .insert(insertData)
      .select()
      .single()

    if (deckPageError) {
      console.log("[SERVER] === DEBUG: Deck page insertion failed ===")
      console.log("[SERVER] Error code:", deckPageError.code)
      console.log("[SERVER] Error message:", deckPageError.message)
      console.log("[SERVER] Error details:", deckPageError.details)
      console.log("[SERVER] Error hint:", deckPageError.hint)
      throw new Error(`デッキページの作成に失敗しました: ${deckPageError.message}`)
    }

    console.log("[SERVER] === DEBUG: Deck page created successfully ===")
    console.log("[SERVER] Deck page ID:", deckPage.id)

    // キャッシュを更新
    revalidatePath("/admin/decks")
    revalidatePath("/decks")

    console.log("[SERVER] === DEBUG: Deck page creation completed ===")
    return { success: true, data: deckPage }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in createDeckPage ===")
    console.log("[SERVER] Error message:", error instanceof Error ? error.message : String(error))
    console.log("[SERVER] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.log("[SERVER] Full error object:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキページの作成に失敗しました",
    }
  }
}

export async function updateDeckPage(id: string, deckData: DeckPageData) {
  console.log("[SERVER] === DEBUG: updateDeckPage function started ===")
  console.log("[SERVER] Deck page ID:", id)
  console.log("[SERVER] Update data:", JSON.stringify(deckData, null, 2))

  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    // デッキカードの枚数検証
    const totalCards = deckData.deck_cards.reduce((sum, card) => sum + card.card_count, 0)
    if (totalCards !== 20) {
      throw new Error(`デッキはちょうど20枚である必要があります。(現在: ${totalCards}枚)`)
    }

    // 各カードの枚数制限チェック
    const invalidCards = deckData.deck_cards.filter((card) => card.card_count < 1 || card.card_count > 2)
    if (invalidCards.length > 0) {
      throw new Error("同じカードは1〜2枚までです。")
    }

    // deck_cardsをJSON形式に変換（実際のDB構造に合わせて修正）
    const deckCardsWithPackNames = await Promise.all(
      deckData.deck_cards.map(async (card) => {
        // カード情報からpack_nameを取得
        const { data: cardInfo } = await supabase.from("cards").select("pack_id").eq("id", card.card_id).single()

        let packName = "不明なパック"
        if (cardInfo?.pack_id) {
          const { data: packInfo } = await supabase.from("packs").select("name").eq("id", cardInfo.pack_id).single()
          packName = packInfo?.name || "不明なパック"
        }

        return {
          card_id: card.card_id,
          pack_name: packName,
          card_count: card.card_count, // quantityではなくcard_count
          display_order: card.display_order,
        }
      }),
    )

    // strengths_weaknesses_detailsをJSON文字列形式に変換（HTMLタグ対応）
    const strengthsWeaknessesDetailsJson = JSON.stringify(
      deckData.strengths_weaknesses.map((item) => ({
        title: item.title,
        description: item.description, // HTMLタグをそのまま保持
        image_urls: item.image_urls,
        display_order: item.display_order,
      })),
    )

    // how_to_play_stepsをJSON文字列形式に変換（HTMLタグ対応）
    const howToPlayStepsJson = JSON.stringify(
      deckData.play_steps.map((step) => ({
        title: step.title,
        description: step.description, // HTMLタグをそのまま保持
        image_urls: step.image_urls,
        step_number: step.step_number,
      })),
    )

    // サムネイル画像URLを設定
    let thumbnailImageUrl = deckData.thumbnail_image_url || "/placeholder.svg?height=400&width=600"
    if (!deckData.thumbnail_image_url && deckData.deck_cards.length > 0) {
      thumbnailImageUrl = `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(deckData.deck_name)}`
    }

    // 更新データの準備（実際のDB構造に合わせて修正）
    const updateData = {
      title: deckData.title,
      deck_name: deckData.deck_name,
      deck_description: deckData.deck_description || null,
      deck_badge: deckData.deck_badge || null,
      thumbnail_image_url: thumbnailImageUrl,
      thumbnail_alt: deckData.thumbnail_alt || null,
      section1_title: deckData.section1_title || "デッキ概要",
      section2_title: deckData.section2_title || "強み・弱み",
      section3_title: deckData.section3_title || "デッキの回し方",
      category: deckData.category as any, // deck_category enum
      energy_type: deckData.energy_type || "無色",
      evaluation_title: deckData.evaluation_title || "デッキ評価",
      tier_rank: deckData.tier_rank,
      tier_name: deckData.tier_name || "Tier1",
      tier_descriptions: deckData.tier_descriptions.filter((desc) => desc.trim()),
      is_published: deckData.is_published,
      stat_accessibility: deckData.stats.accessibility,
      stat_speed: deckData.stats.speed,
      stat_power: deckData.stats.power,
      stat_durability: deckData.stats.durability,
      stat_stability: deckData.stats.stability,
      strengths_weaknesses_list: deckData.strengths_weaknesses_list.filter((item) => item.trim()),
      how_to_play_list: deckData.how_to_play_list.filter((item) => item.trim()),
      deck_cards: JSON.stringify(deckCardsWithPackNames), // JSON文字列として格納
      strengths_weaknesses_details: strengthsWeaknessesDetailsJson, // JSON文字列として格納
      how_to_play_steps: howToPlayStepsJson, // JSON文字列として格納
      // updated_atは自動更新されるため削除
    }

    // デッキページを更新
    const { data: deckPage, error: deckPageError } = await supabase
      .from("deck_pages")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (deckPageError) {
      throw new Error(`デッキページの更新に失敗しました: ${deckPageError.message}`)
    }

    // キャッシュを更新
    revalidatePath("/admin/decks")
    revalidatePath("/decks")
    revalidatePath(`/decks/${deckPage.id}`)

    return { success: true, data: deckPage }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in updateDeckPage ===")
    console.log("[SERVER] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキページの更新に失敗しました",
    }
  }
}

export async function getDeckPages() {
  console.log("[SERVER] === DEBUG: getDeckPages function started ===")

  try {
    const supabase = await createClient()

    console.log("[SERVER] === DEBUG: Fetching deck pages ===")
    const { data: deckPages, error } = await supabase
      .from("deck_pages")
      .select(`
        id,
        title,
        deck_name,
        category,
        is_published,
        tier_rank,
        view_count,
        like_count,
        comment_count,
        favorite_count,
        created_at
      `)
      .order("created_at", { ascending: false })

    console.log("[SERVER] === DEBUG: Deck pages fetch result ===")
    console.log("[SERVER] Deck pages count:", deckPages?.length || 0)
    console.log("[SERVER] Fetch error:", error)

    if (error) {
      console.log("[SERVER] === DEBUG: Deck pages fetch failed ===")
      console.log("[SERVER] Error code:", error.code)
      console.log("[SERVER] Error message:", error.message)
      console.log("[SERVER] Error details:", error.details)
      throw new Error(`デッキページの取得に失敗しました: ${error.message}`)
    }

    console.log("[SERVER] === DEBUG: Deck pages fetched successfully ===")
    return { success: true, data: deckPages || [] }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in getDeckPages ===")
    console.log("[SERVER] Error message:", error instanceof Error ? error.message : String(error))
    console.log("[SERVER] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキページの取得に失敗しました",
    }
  }
}

export async function getDeckPageById(id: string) {
  console.log("[SERVER] === DEBUG: getDeckPageById function started ===")
  console.log("[SERVER] Deck page ID:", id)

  try {
    const supabase = await createClient()

    const { data: deckPage, error: deckPageError } = await supabase.from("deck_pages").select("*").eq("id", id).single()

    console.log("[SERVER] === DEBUG: Deck page fetch result ===")
    console.log("[SERVER] Deck page data:", deckPage ? "found" : "not found")
    console.log("[SERVER] Deck page error:", deckPageError)

    if (deckPageError) {
      throw new Error(`デッキページの取得に失敗しました: ${deckPageError.message}`)
    }

    console.log("[SERVER] === DEBUG: Deck page fetched successfully ===")
    return {
      success: true,
      data: deckPage,
    }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in getDeckPageById ===")
    console.log("[SERVER] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキページの取得に失敗しました",
    }
  }
}

export async function deleteDeckPage(id: string) {
  console.log("[SERVER] === DEBUG: deleteDeckPage function started ===")
  console.log("[SERVER] Deck page ID:", id)

  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[SERVER] === DEBUG: Current user for delete ===")
    console.log("[SERVER] User ID:", user?.id)
    console.log("[SERVER] User error:", userError)

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    // デッキページを削除
    const { error } = await supabase.from("deck_pages").delete().eq("id", id)

    console.log("[SERVER] === DEBUG: Delete operation result ===")
    console.log("[SERVER] Delete error:", error)

    if (error) {
      throw new Error(`デッキページの削除に失敗しました: ${error.message}`)
    }

    // キャッシュを更新
    revalidatePath("/admin/decks")
    revalidatePath("/decks")

    console.log("[SERVER] === DEBUG: Deck page deleted successfully ===")
    return { success: true }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in deleteDeckPage ===")
    console.log("[SERVER] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキページの削除に失敗しました",
    }
  }
}

export async function toggleDeckPagePublished(id: string, isPublished: boolean) {
  console.log("[SERVER] === DEBUG: toggleDeckPagePublished function started ===")
  console.log("[SERVER] Deck page ID:", id)
  console.log("[SERVER] New published status:", isPublished)

  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[SERVER] === DEBUG: Current user for toggle published ===")
    console.log("[SERVER] User ID:", user?.id)
    console.log("[SERVER] User error:", userError)

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    const { data, error } = await supabase
      .from("deck_pages")
      .update({ is_published: isPublished })
      .eq("id", id)
      .select()
      .single()

    console.log("[SERVER] === DEBUG: Toggle published result ===")
    console.log("[SERVER] Updated data:", data ? "success" : "failed")
    console.log("[SERVER] Update error:", error)

    if (error) {
      throw new Error(`公開状態の変更に失敗しました: ${error.message}`)
    }

    // キャッシュを更新
    revalidatePath("/admin/decks")
    revalidatePath("/decks")

    console.log("[SERVER] === DEBUG: Deck page published status toggled successfully ===")
    return { success: true, data }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in toggleDeckPagePublished ===")
    console.log("[SERVER] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "公開状態の変更に失敗しました",
    }
  }
}
