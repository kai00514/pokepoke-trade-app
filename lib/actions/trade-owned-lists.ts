"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface TradeOwnedList {
  id: number
  user_id: string
  list_name: string
  card_ids: number[]
  created_at: string
  updated_at: string
}

export async function getTradeOwnedLists(userId: string) {
  try {
    const supabase = await createServerClient()

    const { data: lists, error } = await supabase
      .from("trade_owned_list")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching trade owned lists:", error)
      return { success: false, error: `リストの取得に失敗しました: ${error.message}`, lists: [] }
    }

    return { success: true, lists: lists || [] }
  } catch (error) {
    console.error("Unexpected error fetching trade owned lists:", error)
    return { success: false, error: "予期しないエラーが発生しました。", lists: [] }
  }
}

export async function getUserOwnedLists(userId: string) {
  return await getTradeOwnedLists(userId)
}

export async function createTradeOwnedList(userId: string, listName: string) {
  try {
    const supabase = await createServerClient()

    if (!listName.trim()) {
      return { success: false, error: "リスト名を入力してください。" }
    }

    const { data: newList, error } = await supabase
      .from("trade_owned_list")
      .insert({
        user_id: userId,
        list_name: listName.trim(),
        card_ids: [],
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating trade owned list:", error)
      return { success: false, error: `リストの作成に失敗しました: ${error.message}` }
    }

    revalidatePath("/lists")
    return { success: true, list: newList }
  } catch (error) {
    console.error("Unexpected error creating trade owned list:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}

export async function createOwnedList(userId: string, listName: string, cardIds: number[] = []) {
  console.log("=== createOwnedList DEBUG START ===")
  console.log("Parameters received:")
  console.log("- userId:", userId)
  console.log("- listName:", listName)
  console.log("- cardIds:", cardIds)
  console.log("- cardIds length:", cardIds.length)
  console.log("- cardIds type:", typeof cardIds)

  try {
    const supabase = await createServerClient()
    console.log("Supabase client created successfully")

    if (!listName.trim()) {
      console.log("Validation failed: listName is empty")
      return { success: false, error: "リスト名を入力してください。" }
    }

    if (cardIds.length > 35) {
      console.log("Validation failed: too many cards")
      return { success: false, error: "カードは35枚まで登録できます。" }
    }

    console.log("Validation passed, attempting to insert into database")

    const insertData = {
      user_id: userId,
      list_name: listName.trim(),
      card_ids: cardIds,
    }
    console.log("Insert data:", insertData)

    const { data: newList, error } = await supabase.from("trade_owned_list").insert(insertData).select().single()

    console.log("Supabase insert result:")
    console.log("- data:", newList)
    console.log("- error:", error)

    if (error) {
      console.error("Error creating owned list:", error)
      console.log("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return { success: false, error: `リストの作成に失敗しました: ${error.message}` }
    }

    console.log("Insert successful, calling revalidatePath")
    revalidatePath("/lists")

    const result = { success: true, list: newList }
    console.log("Final result:", result)
    console.log("=== createOwnedList DEBUG END ===")

    return result
  } catch (error) {
    console.error("Unexpected error creating owned list:", error)
    console.log("Unexpected error details:", error)
    console.log("=== createOwnedList DEBUG END (ERROR) ===")
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}

export async function updateTradeOwnedList(listId: number, userId: string, listName: string, cardIds: number[]) {
  try {
    const supabase = await createServerClient()

    if (!listName.trim()) {
      return { success: false, error: "リスト名を入力してください。" }
    }

    if (cardIds.length > 35) {
      return { success: false, error: "カードは35枚まで登録できます。" }
    }

    // 所有者確認
    const { data: existingList, error: checkError } = await supabase
      .from("trade_owned_list")
      .select("user_id")
      .eq("id", listId)
      .single()

    if (checkError || !existingList) {
      return { success: false, error: "リストが見つかりません。" }
    }

    if (existingList.user_id !== userId) {
      return { success: false, error: "このリストを編集する権限がありません。" }
    }

    const { data: updatedList, error } = await supabase
      .from("trade_owned_list")
      .update({
        list_name: listName.trim(),
        card_ids: cardIds,
      })
      .eq("id", listId)
      .select()
      .single()

    if (error) {
      console.error("Error updating trade owned list:", error)
      return { success: false, error: `リストの更新に失敗しました: ${error.message}` }
    }

    revalidatePath("/lists")
    return { success: true, list: updatedList }
  } catch (error) {
    console.error("Unexpected error updating trade owned list:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}

export async function deleteTradeOwnedList(listId: number, userId: string) {
  try {
    const supabase = await createServerClient()

    // 所有者確認
    const { data: existingList, error: checkError } = await supabase
      .from("trade_owned_list")
      .select("user_id")
      .eq("id", listId)
      .single()

    if (checkError || !existingList) {
      return { success: false, error: "リストが見つかりません。" }
    }

    if (existingList.user_id !== userId) {
      return { success: false, error: "このリストを削除する権限がありません。" }
    }

    const { error } = await supabase.from("trade_owned_list").delete().eq("id", listId)

    if (error) {
      console.error("Error deleting trade owned list:", error)
      return { success: false, error: `リストの削除に失敗しました: ${error.message}` }
    }

    revalidatePath("/lists")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error deleting trade owned list:", error)
    return { success: false, error: "予期しないエラーが発生しました。" }
  }
}

export async function deleteOwnedList(listId: number, userId: string) {
  return await deleteTradeOwnedList(listId, userId)
}
