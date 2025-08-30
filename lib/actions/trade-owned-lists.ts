"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export interface TradeOwnedList {
  id: number
  name: string
  card_ids: number[]
  user_id: string
  created_at: string
  updated_at: string
}

export async function createTradeOwnedList(name: string, cardIds: number[]) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "認証が必要です" }
    }

    const { data, error } = await supabase
      .from("trade_owned_list")
      .insert({
        name,
        card_ids: cardIds,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating trade owned list:", error)
      return { success: false, error: "リストの作成に失敗しました" }
    }

    return { success: true, list: data }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function updateTradeOwnedList(listId: number, userId: string, name: string, cardIds: number[]) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return { success: false, error: "認証が必要です" }
    }

    const { data, error } = await supabase
      .from("trade_owned_list")
      .update({
        name,
        card_ids: cardIds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating trade owned list:", error)
      return { success: false, error: "リストの更新に失敗しました" }
    }

    return { success: true, list: data }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function deleteTradeOwnedList(listId: number) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "認証が必要です" }
    }

    const { error } = await supabase.from("trade_owned_list").delete().eq("id", listId).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting trade owned list:", error)
      return { success: false, error: "リストの削除に失敗しました" }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function getTradeOwnedLists(userId: string) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("trade_owned_list")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching trade owned lists:", error)
      return { success: false, error: "リストの取得に失敗しました" }
    }

    return { success: true, lists: data || [] }
  } catch (error) {
    console.error("Unexpected error:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}
