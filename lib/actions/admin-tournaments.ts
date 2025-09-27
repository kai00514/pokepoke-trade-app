"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Tournament {
  id?: number
  title: string
  event_date: string
  is_online: boolean
  benefit: string
  detail_url: string
  is_published: boolean
}

export async function getTournaments(showAll = false) {
  const supabase = await createClient()

  // Auto-hide past tournaments
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(23, 59, 59, 999)

  await supabase.from("tournaments").update({ is_published: false }).lt("event_date", yesterday.toISOString())

  let query = supabase.from("tournaments").select("*").order("event_date", { ascending: true })

  if (!showAll) {
    query = query.eq("is_published", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching tournaments:", error)
    return []
  }

  return data || []
}

export async function createTournament(tournament: Omit<Tournament, "id">) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("tournaments").insert([tournament]).select().single()

  if (error) {
    console.error("Error creating tournament:", error)
    throw new Error("トーナメントの作成に失敗しました")
  }

  revalidatePath("/admin/tournaments")
  revalidatePath("/info")
  return data
}

export async function updateTournament(id: number, tournament: Omit<Tournament, "id">) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("tournaments").update(tournament).eq("id", id).select().single()

  if (error) {
    console.error("Error updating tournament:", error)
    throw new Error("トーナメントの更新に失敗しました")
  }

  revalidatePath("/admin/tournaments")
  revalidatePath("/info")
  return data
}

export async function deleteTournament(id: number) {
  const supabase = await createClient()

  const { error } = await supabase.from("tournaments").delete().eq("id", id)

  if (error) {
    console.error("Error deleting tournament:", error)
    throw new Error("トーナメントの削除に失敗しました")
  }

  revalidatePath("/admin/tournaments")
  revalidatePath("/info")
}
