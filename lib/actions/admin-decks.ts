"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface DeckCard {
  card_id: number
  pack_name: string
  card_count: number
  display_order: number
}

export interface StrengthWeakness {
  title: string
  image_urls: string[]
  description: string
  display_order: number
}

export interface HowToPlayStep {
  title: string
  image_urls: string[]
  description: string
  step_number: number
}

export interface CreateDeckData {
  // 基本情報
  title: string
  deck_name: string
  category: "tier" | "featured" | "newpack"
  thumbnail_image_url?: string
  thumbnail_alt?: string
  deck_badge?: string

  // セクション1
  section1_title?: string
  energy_type: string
  energy_image_url?: string
  deck_cards: DeckCard[]
  deck_description: string

  // 評価セクション
  evaluation_title?: string
  tier_rank: string
  tier_name: string
  tier_descriptions: string[]
  stat_accessibility: number
  stat_speed: number
  stat_power: number
  stat_durability: number
  stat_stability: number

  // セクション2
  section2_title?: string
  strengths_weaknesses_list: string[]
  strengths_weaknesses_details: StrengthWeakness[]

  // セクション3
  section3_title?: string
  how_to_play_list: string[]
  how_to_play_steps: HowToPlayStep[]

  // その他
  is_published: boolean
  view_count?: number
  like_count?: number
  favorite_count?: number
  eval_value?: string
  eval_count?: number
  comment_count?: number
}

export interface DeckPage {
  id: string
  title: string
  deck_name: string
  category: string
  tier_rank: string
  tier_name: string
  is_published: boolean
  view_count: number
  like_count: number
  favorite_count: number
  created_at: string
  updated_at: string
  thumbnail_image_url?: string
}

export async function createDeck(deckData: CreateDeckData) {
  console.log("[SERVER] === DEBUG: createDeck function started ===")
  console.log("[SERVER] Input deck data:", JSON.stringify(deckData, null, 2))

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

    // JSONフィールドを文字列化
    const insertData = {
      title: deckData.title,
      deck_name: deckData.deck_name,
      category: deckData.category,
      thumbnail_image_url: deckData.thumbnail_image_url,
      thumbnail_alt: deckData.thumbnail_alt || deckData.deck_name,
      deck_badge: deckData.deck_badge || deckData.deck_name,
      section1_title: deckData.section1_title || `${deckData.deck_name}のレシピと評価`,
      energy_type: deckData.energy_type,
      energy_image_url: deckData.energy_image_url,
      deck_cards: JSON.stringify(deckData.deck_cards),
      deck_description: deckData.deck_description,
      evaluation_title: deckData.evaluation_title || `${deckData.deck_name}の評価`,
      tier_rank: deckData.tier_rank,
      tier_name: deckData.tier_name,
      tier_descriptions: deckData.tier_descriptions,
      stat_accessibility: deckData.stat_accessibility,
      stat_speed: deckData.stat_speed,
      stat_power: deckData.stat_power,
      stat_durability: deckData.stat_durability,
      stat_stability: deckData.stat_stability,
      section2_title: deckData.section2_title || `${deckData.deck_name}の強い点・弱い点`,
      strengths_weaknesses_list: deckData.strengths_weaknesses_list,
      strengths_weaknesses_details: JSON.stringify(deckData.strengths_weaknesses_details),
      section3_title: deckData.section3_title || `${deckData.deck_name}の回し方`,
      how_to_play_list: deckData.how_to_play_list,
      how_to_play_steps: JSON.stringify(deckData.how_to_play_steps),
      is_published: deckData.is_published,
      view_count: deckData.view_count || 0,
      like_count: deckData.like_count || 0,
      favorite_count: deckData.favorite_count || 0,
      eval_value: deckData.eval_value || "0.00",
      eval_count: deckData.eval_count || 0,
      comment_count: deckData.comment_count || 0,
      last_updated: new Date().toISOString(),
    }

    console.log("[SERVER] Prepared insert data:", JSON.stringify(insertData, null, 2))

    const { data: deck, error: deckError } = await supabase.from("deck_pages").insert(insertData).select().single()

    if (deckError) {
      console.log("[SERVER] Deck insertion failed:", deckError)
      throw new Error(`デッキの作成に失敗しました: ${deckError.message}`)
    }

    console.log("[SERVER] Deck created successfully:", deck.id)

    // キャッシュを更新
    revalidatePath("/admin/decks")
    revalidatePath("/content")

    return { success: true, data: deck }
  } catch (error) {
    console.log("[SERVER] Error in createDeck:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキの作成に失敗しました",
    }
  }
}

export async function updateDeck(id: string, deckData: CreateDeckData) {
  console.log("[SERVER] === DEBUG: updateDeck function started ===")
  console.log("[SERVER] Deck ID:", id)

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    const updateData = {
      title: deckData.title,
      deck_name: deckData.deck_name,
      category: deckData.category,
      thumbnail_image_url: deckData.thumbnail_image_url,
      thumbnail_alt: deckData.thumbnail_alt || deckData.deck_name,
      deck_badge: deckData.deck_badge || deckData.deck_name,
      section1_title: deckData.section1_title || `${deckData.deck_name}のレシピと評価`,
      energy_type: deckData.energy_type,
      energy_image_url: deckData.energy_image_url,
      deck_cards: JSON.stringify(deckData.deck_cards),
      deck_description: deckData.deck_description,
      evaluation_title: deckData.evaluation_title || `${deckData.deck_name}の評価`,
      tier_rank: deckData.tier_rank,
      tier_name: deckData.tier_name,
      tier_descriptions: deckData.tier_descriptions,
      stat_accessibility: deckData.stat_accessibility,
      stat_speed: deckData.stat_speed,
      stat_power: deckData.stat_power,
      stat_durability: deckData.stat_durability,
      stat_stability: deckData.stat_stability,
      section2_title: deckData.section2_title || `${deckData.deck_name}の強い点・弱い点`,
      strengths_weaknesses_list: deckData.strengths_weaknesses_list,
      strengths_weaknesses_details: JSON.stringify(deckData.strengths_weaknesses_details),
      section3_title: deckData.section3_title || `${deckData.deck_name}の回し方`,
      how_to_play_list: deckData.how_to_play_list,
      how_to_play_steps: JSON.stringify(deckData.how_to_play_steps),
      is_published: deckData.is_published,
      view_count: deckData.view_count || 0,
      like_count: deckData.like_count || 0,
      favorite_count: deckData.favorite_count || 0,
      eval_value: deckData.eval_value || "0.00",
      eval_count: deckData.eval_count || 0,
      comment_count: deckData.comment_count || 0,
      updated_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    }

    const { data: deck, error: deckError } = await supabase
      .from("deck_pages")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (deckError) {
      throw new Error(`デッキの更新に失敗しました: ${deckError.message}`)
    }

    revalidatePath("/admin/decks")
    revalidatePath("/content")
    revalidatePath(`/content/${id}`)

    return { success: true, data: deck }
  } catch (error) {
    console.log("[SERVER] Error in updateDeck:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキの更新に失敗しました",
    }
  }
}

export async function getDecks() {
  console.log("[SERVER] === DEBUG: getDecks function started ===")

  try {
    const supabase = await createClient()

    const { data: decks, error } = await supabase
      .from("deck_pages")
      .select(`
        id,
        title,
        deck_name,
        category,
        tier_rank,
        tier_name,
        is_published,
        view_count,
        like_count,
        favorite_count,
        created_at,
        updated_at,
        thumbnail_image_url
      `)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`デッキの取得に失敗しました: ${error.message}`)
    }

    return { success: true, data: decks || [] }
  } catch (error) {
    console.log("[SERVER] Error in getDecks:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキの取得に失敗しました",
    }
  }
}

export async function getDeckById(id: string) {
  console.log("[SERVER] === DEBUG: getDeckById function started ===")
  console.log("[SERVER] Deck ID:", id)

  try {
    const supabase = await createClient()

    const { data: deck, error } = await supabase.from("deck_pages").select("*").eq("id", id).single()

    if (error) {
      throw new Error(`デッキの取得に失敗しました: ${error.message}`)
    }

    // JSONフィールドをパース
    const parsedDeck = {
      ...deck,
      deck_cards: JSON.parse(deck.deck_cards || "[]"),
      strengths_weaknesses_details: JSON.parse(deck.strengths_weaknesses_details || "[]"),
      how_to_play_steps: JSON.parse(deck.how_to_play_steps || "[]"),
    }

    return { success: true, data: parsedDeck }
  } catch (error) {
    console.log("[SERVER] Error in getDeckById:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキの取得に失敗しました",
    }
  }
}

export async function deleteDeck(id: string) {
  console.log("[SERVER] === DEBUG: deleteDeck function started ===")
  console.log("[SERVER] Deck ID:", id)

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    const { error } = await supabase.from("deck_pages").delete().eq("id", id)

    if (error) {
      throw new Error(`デッキの削除に失敗しました: ${error.message}`)
    }

    revalidatePath("/admin/decks")
    revalidatePath("/content")

    return { success: true }
  } catch (error) {
    console.log("[SERVER] Error in deleteDeck:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキの削除に失敗しました",
    }
  }
}

export async function toggleDeckPublished(id: string, isPublished: boolean) {
  console.log("[SERVER] === DEBUG: toggleDeckPublished function started ===")

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    const { data, error } = await supabase
      .from("deck_pages")
      .update({ is_published: isPublished })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`公開状態の変更に失敗しました: ${error.message}`)
    }

    revalidatePath("/admin/decks")
    revalidatePath("/content")

    return { success: true, data }
  } catch (error) {
    console.log("[SERVER] Error in toggleDeckPublished:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "公開状態の変更に失敗しました",
    }
  }
}
