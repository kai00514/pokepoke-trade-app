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
    console.log("Creating trade owned list with:", [userId, listName, cardIds])

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // 認証確認
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("No authenticated user found")
      return { success: false, error: "認証が必要です。" }
    }

    if (user.id !== userId) {
      console.error("User ID mismatch:", { authUserId: user.id, providedUserId: userId })
      return { success: false, error: "認証エラーが発生しました。" }
    }

    if (!listName.trim()) {
      return { success: false, error: "リスト名を入力してください。" }
    }

    // データベースに挿入
    const insertData = {
      list_name: listName.trim(),
      card_ids: cardIds || [],
      user_id: userId,
    }

    console.log("Inserting data:", insertData)

    const { data, error } = await supabase.from("trade_owned_list").insert(insertData).select().single()

    if (error) {
      console.error("Database error creating trade owned list:", error)
      return {
        success: false,
        error: `リストの作成に失敗しました: ${error.message}`,
        details: error,
      }
    }

    console.log("Successfully created list:", data)
    revalidatePath("/lists")
    return { success: true, list: data }
  } catch (error) {
    console.error("Unexpected error creating trade owned list:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}

export async function updateTradeOwnedList(listId: number, userId: string, listName: string, cardIds: number[]) {
  try {
    console.log("Updating trade owned list:", { listId, userId, listName, cardIds })

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // 認証確認
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return { success: false, error: "認証が必要です。" }
    }

    if (!listName.trim()) {
      return { success: false, error: "リスト名を入力してください。" }
    }

    // 所有者確認
    const { data: existingList, error: checkError } = await supabase
      .from("trade_owned_list")
      .select("user_id")
      .eq("id", listId)
      .single()

    if (checkError || !existingList) {
      console.error("List not found:", checkError)
      return { success: false, error: "リストが見つかりません。" }
    }

    if (existingList.user_id !== userId) {
      return { success: false, error: "このリストを編集する権限がありません。" }
    }

    const updateData = {
      list_name: listName.trim(),
      card_ids: cardIds || [],
      updated_at: new Date().toISOString(),
    }

    console.log("Updating with data:", updateData)

    const { data, error } = await supabase
      .from("trade_owned_list")
      .update(updateData)
      .eq("id", listId)
      .select()
      .single()

    if (error) {
      console.error("Database error updating trade owned list:", error)
      return { success: false, error: `リストの更新に失敗しました: ${error.message}` }
    }

    console.log("Successfully updated list:", data)
    revalidatePath("/lists")
    return { success: true, list: data }
  } catch (error) {
    console.error("Unexpected error updating trade owned list:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}

export async function deleteTradeOwnedList(listId: number) {
  try {
    console.log("Deleting trade owned list:", listId)

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "認証が必要です。" }
    }

    // 所有者確認
    const { data: existingList, error: checkError } = await supabase
      .from("trade_owned_list")
      .select("user_id")
      .eq("id", listId)
      .single()

    if (checkError || !existingList) {
      console.error("List not found for deletion:", checkError)
      return { success: false, error: "リストが見つかりません。" }
    }

    if (existingList.user_id !== user.id) {
      return { success: false, error: "このリストを削除する権限がありません。" }
    }

    const { error } = await supabase.from("trade_owned_list").delete().eq("id", listId)

    if (error) {
      console.error("Database error deleting trade owned list:", error)
      return { success: false, error: `リストの削除に失敗しました: ${error.message}` }
    }

    console.log("Successfully deleted list:", listId)
    revalidatePath("/lists")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting trade owned list:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}

export async function getTradeOwnedLists(userId: string) {
  try {
    console.log("Fetching trade owned lists for user:", userId)

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data, error } = await supabase
      .from("trade_owned_list")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Database error fetching trade owned lists:", error)
      return { success: false, error: "リストの取得に失敗しました", lists: [] }
    }

    console.log("Successfully fetched lists:", data)
    return { success: true, lists: data || [] }
  } catch (error) {
    console.error("Unexpected error fetching trade owned lists:", error)
    return { success: false, error: "予期しないエラーが発生しました", lists: [] }
  }
}
