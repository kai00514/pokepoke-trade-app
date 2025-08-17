"use server"

import { createClient } from "@/lib/supabase/server"

export interface UserStats {
  totalUsers: number
  confirmedUsers: number
  thisMonthUsers: number
}

export interface UserData {
  id: string
  email: string
  display_name?: string
  name?: string
  pokepoke_id?: string
  avatar_url?: string
  email_confirmed_at?: string
  created_at: string
  last_sign_in_at?: string
}

export async function getUsersStats(): Promise<UserStats> {
  const supabase = createClient()

  try {
    // 総ユーザー数
    const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

    // 認証済みユーザー数
    const { count: confirmedUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .not("email_confirmed_at", "is", null)

    // 今月の新規登録ユーザー数
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const { count: thisMonthUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thisMonth.toISOString())

    return {
      totalUsers: totalUsers || 0,
      confirmedUsers: confirmedUsers || 0,
      thisMonthUsers: thisMonthUsers || 0,
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return {
      totalUsers: 0,
      confirmedUsers: 0,
      thisMonthUsers: 0,
    }
  }
}

export async function getUsersList(limit = 50): Promise<UserData[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        display_name,
        name,
        pokepoke_id,
        avatar_url,
        email_confirmed_at,
        created_at,
        last_sign_in_at
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching users list:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching users list:", error)
    return []
  }
}
