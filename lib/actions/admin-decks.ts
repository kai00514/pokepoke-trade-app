"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CreateDeckData {
  // 基本情報
  title: string
  deck_name: string
  category: string
  thumbnail_image_url: string
  thumbnail_alt: string
  deck_badge: string

  // セクション1
  section1_title: string
  energy_type: string
  energy_image_url: string
  deck_cards: Array<{
    card_id: number
    card_count: number
    pack_name?: string
  }>
  deck_description: string

  // 評価セクション
  evaluation_title: string
  tier_rank: string
  tier_name: string
  tier_descriptions: string[]
  stat_accessibility: number
  stat_speed: number
  stat_power: number
  stat_durability: number
  stat_stability: number

  // セクション2
  section2_title: string
  strengths_weaknesses_list: string[]
  strengths_weaknesses_details: Array<{
    title: string
    image_urls: string[]
    description: string
    display_order: number
  }>

  // セクション3
  section3_title: string
  how_to_play_list: string[]
  how_to_play_steps: Array<{
    title: string
    image_urls: string[]
    description: string
    step_number: number
  }>

  // その他
  is_published: boolean
  view_count: number
  like_count: number
  favorite_count: number
  eval_value: string
  eval_count: number
  comment_count: number
}

export async function createDeck(data: CreateDeckData) {
  try {
    const supabase = await createClient()

    const { data: deck, error } = await supabase
      .from("deck_pages")
      .insert({
        title: data.title,
        deck_name: data.deck_name,
        category: data.category,
        thumbnail_image_url: data.thumbnail_image_url,
        thumbnail_alt: data.thumbnail_alt,
        deck_badge: data.deck_badge,
        section1_title: data.section1_title,
        energy_type: data.energy_type,
        energy_image_url: data.energy_image_url,
        deck_cards: data.deck_cards,
        deck_description: data.deck_description,
        evaluation_title: data.evaluation_title,
        tier_rank: data.tier_rank,
        tier_name: data.tier_name,
        tier_descriptions: data.tier_descriptions,
        stat_accessibility: data.stat_accessibility,
        stat_speed: data.stat_speed,
        stat_power: data.stat_power,
        stat_durability: data.stat_durability,
        stat_stability: data.stat_stability,
        section2_title: data.section2_title,
        strengths_weaknesses_list: data.strengths_weaknesses_list,
        strengths_weaknesses_details: data.strengths_weaknesses_details,
        section3_title: data.section3_title,
        how_to_play_list: data.how_to_play_list,
        how_to_play_steps: data.how_to_play_steps,
        is_published: data.is_published,
        view_count: data.view_count,
        like_count: data.like_count,
        favorite_count: data.favorite_count,
        eval_value: data.eval_value,
        eval_count: data.eval_count,
        comment_count: data.comment_count,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating deck:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/decks")
    return { success: true, data: deck }
  } catch (error) {
    console.error("Error creating deck:", error)
    return { success: false, error: "デッキの作成に失敗しました" }
  }
}

export async function updateDeck(id: number, data: CreateDeckData) {
  try {
    const supabase = await createClient()

    const { data: deck, error } = await supabase
      .from("deck_pages")
      .update({
        title: data.title,
        deck_name: data.deck_name,
        category: data.category,
        thumbnail_image_url: data.thumbnail_image_url,
        thumbnail_alt: data.thumbnail_alt,
        deck_badge: data.deck_badge,
        section1_title: data.section1_title,
        energy_type: data.energy_type,
        energy_image_url: data.energy_image_url,
        deck_cards: data.deck_cards,
        deck_description: data.deck_description,
        evaluation_title: data.evaluation_title,
        tier_rank: data.tier_rank,
        tier_name: data.tier_name,
        tier_descriptions: data.tier_descriptions,
        stat_accessibility: data.stat_accessibility,
        stat_speed: data.stat_speed,
        stat_power: data.stat_power,
        stat_durability: data.stat_durability,
        stat_stability: data.stat_stability,
        section2_title: data.section2_title,
        strengths_weaknesses_list: data.strengths_weaknesses_list,
        strengths_weaknesses_details: data.strengths_weaknesses_details,
        section3_title: data.section3_title,
        how_to_play_list: data.how_to_play_list,
        how_to_play_steps: data.how_to_play_steps,
        is_published: data.is_published,
        view_count: data.view_count,
        like_count: data.like_count,
        favorite_count: data.favorite_count,
        eval_value: data.eval_value,
        eval_count: data.eval_count,
        comment_count: data.comment_count,
        last_updated: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating deck:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/decks")
    revalidatePath(`/content/${id}`)
    return { success: true, data: deck }
  } catch (error) {
    console.error("Error updating deck:", error)
    return { success: false, error: "デッキの更新に失敗しました" }
  }
}

export async function deleteDeck(id: number) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("deck_pages").delete().eq("id", id)

    if (error) {
      console.error("Error deleting deck:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/decks")
    return { success: true }
  } catch (error) {
    console.error("Error deleting deck:", error)
    return { success: false, error: "デッキの削除に失敗しました" }
  }
}

export async function toggleDeckPublished(id: number, isPublished: boolean) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("deck_pages")
      .update({
        is_published: isPublished,
        last_updated: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error toggling deck published status:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/decks")
    revalidatePath(`/content/${id}`)
    return { success: true }
  } catch (error) {
    console.error("Error toggling deck published status:", error)
    return { success: false, error: "公開状態の変更に失敗しました" }
  }
}

export async function getDeckById(id: number) {
  try {
    const supabase = await createClient()

    const { data: deck, error } = await supabase.from("deck_pages").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching deck:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: deck }
  } catch (error) {
    console.error("Error fetching deck:", error)
    return { success: false, error: "デッキの取得に失敗しました" }
  }
}

export async function getDecks() {
  try {
    const supabase = await createClient()

    const { data: decks, error } = await supabase
      .from("deck_pages")
      .select("*")
      .order("last_updated", { ascending: false })

    if (error) {
      console.error("Error fetching decks:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: decks || [] }
  } catch (error) {
    console.error("Error fetching decks:", error)
    return { success: false, error: "デッキ一覧の取得に失敗しました" }
  }
}
