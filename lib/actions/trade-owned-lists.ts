"use server"

import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export interface TradeOwnedList {
  id: number
  list_name: string
  card_ids: number[]
  user_id: string
  created_at: string
  updated_at: string
}

export async function createTradeOwnedList(userId: string, listName: string, cardIds: number[]) {
  try {
    console.log("=== Creating trade owned list ===")
    console.log("Parameters:", { userId, listName, cardIds })

    if (!listName.trim()) {
      console.log("Error: Empty list name")
      return { success: false, error: "リスト名を入力してください。" }
    }

    const cookieStore = cookies()
    console.log("Cookies obtained")

    const supabase = createServerClient(cookieStore)
    console.log("Supabase client created")

    // データベースに挿入するデータを準備
    const insertData = {
      user_id: userId,
      list_name: listName.trim(),
      card_ids: cardIds || [],
    }

    console.log("Insert data prepared:", insertData)

    // データベースに挿入
    console.log("Attempting database insert...")
    const { data, error } = await supabase.from("trade_owned_list").insert(insertData).select().single()

    console.log("Database response:", { data, error })

    if (error) {
      console.error("Database error:", error)
      return {
        success: false,
        error: `リストの作成に失敗しました: ${error.message}`,
        details: error,
      }
    }

    if (!data) {
      console.error("No data returned from insert")
      return {
        success: false,
        error: "データの挿入に失敗しました。データが返されませんでした。",
      }
    }

    console.log("Successfully created list:", data)
    revalidatePath("/lists")
    return { success: true, list: data }
  } catch (error) {
    console.error("=== Unexpected error in createTradeOwnedList ===")
    console.error("Error type:", typeof error)
    console.error("Error message:", error instanceof Error ? error.message : String(error))
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Full error object:", error)

    return {
      success: false,
      error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function updateTradeOwnedList(listId: number, userId: string, listName: string, cardIds: number[]) {
  try {
    console.log("=== Updating trade owned list ===")
    console.log("Parameters:", { listId, userId, listName, cardIds })

    if (!listName.trim()) {
      return { success: false, error: "リスト名を入力してください。" }
    }

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const updateData = {
      list_name: listName.trim(),
      card_ids: cardIds || [],
      updated_at: new Date().toISOString(),
    }

    console.log("Update data prepared:", updateData)

    const { data, error } = await supabase
      .from("trade_owned_list")
      .update(updateData)
      .eq("id", listId)
      .eq("user_id", userId)
      .select()
      .single()

    console.log("Database response:", { data, error })

    if (error) {
      console.error("Database error updating trade owned list:", error)
      return { success: false, error: `リストの更新に失敗しました: ${error.message}` }
    }

    if (!data) {
      return { success: false, error: "更新するリストが見つかりませんでした。" }
    }

    console.log("Successfully updated list:", data)
    revalidatePath("/lists")
    return { success: true, list: data }
  } catch (error) {
    console.error("=== Unexpected error in updateTradeOwnedList ===")
    console.error("Full error:", error)
    return {
      success: false,
      error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function deleteTradeOwnedList(listId: number) {
  try {
    console.log("=== Deleting trade owned list ===")
    console.log("List ID:", listId)

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "認証が必要です。" }
    }

    console.log("Authenticated user:", user.id)

    const { error } = await supabase.from("trade_owned_list").delete().eq("id", listId).eq("user_id", user.id)

    if (error) {
      console.error("Database error deleting trade owned list:", error)
      return { success: false, error: `リストの削除に失敗しました: ${error.message}` }
    }

    console.log("Successfully deleted list:", listId)
    revalidatePath("/lists")
    return { success: true }
  } catch (error) {
    console.error("=== Unexpected error in deleteTradeOwnedList ===")
    console.error("Full error:", error)
    return {
      success: false,
      error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function getTradeOwnedLists(userId: string) {
  try {
    console.log("=== Fetching trade owned lists ===")
    console.log("User ID:", userId)

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("trade_owned_list")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    console.log("Database response:", { data, error })

    if (error) {
      console.error("Database error fetching trade owned lists:", error)
      return { success: false, error: "リストの取得に失敗しました", lists: [] }
    }

    console.log("Successfully fetched lists:", data?.length || 0, "items")
    return { success: true, lists: data || [] }
  } catch (error) {
    console.error("=== Unexpected error in getTradeOwnedLists ===")
    console.error("Full error:", error)
    return {
      success: false,
      error: `予期しないエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      lists: [],
    }
  }
}
