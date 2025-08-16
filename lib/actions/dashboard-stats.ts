"use server"

import { createClient } from "@/lib/supabase/server"

export interface DashboardStats {
  totalArticles: number
  publishedArticles: number
  totalUsers: number
  recentArticles: Array<{
    id: string
    title: string
    category: string
    is_published: boolean
    created_at: string
    updated_at: string
  }>
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  console.log("[SERVER] === DEBUG: getDashboardStats function started ===")

  try {
    const supabase = await createClient()

    // 総記事数を取得
    console.log("[SERVER] === DEBUG: Fetching total articles count ===")
    const { count: totalArticles, error: totalArticlesError } = await supabase
      .from("info_articles")
      .select("*", { count: "exact", head: true })

    if (totalArticlesError) {
      console.log("[SERVER] Error fetching total articles:", totalArticlesError)
      throw new Error(`総記事数の取得に失敗しました: ${totalArticlesError.message}`)
    }

    console.log("[SERVER] Total articles count:", totalArticles)

    // 公開記事数を取得
    console.log("[SERVER] === DEBUG: Fetching published articles count ===")
    const { count: publishedArticles, error: publishedArticlesError } = await supabase
      .from("info_articles")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true)

    if (publishedArticlesError) {
      console.log("[SERVER] Error fetching published articles:", publishedArticlesError)
      throw new Error(`公開記事数の取得に失敗しました: ${publishedArticlesError.message}`)
    }

    console.log("[SERVER] Published articles count:", publishedArticles)

    // ユーザー数を取得
    console.log("[SERVER] === DEBUG: Fetching total users count ===")
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (totalUsersError) {
      console.log("[SERVER] Error fetching total users:", totalUsersError)
      throw new Error(`ユーザー数の取得に失敗しました: ${totalUsersError.message}`)
    }

    console.log("[SERVER] Total users count:", totalUsers)

    // 最近の記事を取得（最新5件）
    console.log("[SERVER] === DEBUG: Fetching recent articles ===")
    const { data: recentArticles, error: recentArticlesError } = await supabase
      .from("info_articles")
      .select("id, title, category, is_published, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentArticlesError) {
      console.log("[SERVER] Error fetching recent articles:", recentArticlesError)
      throw new Error(`最近の記事の取得に失敗しました: ${recentArticlesError.message}`)
    }

    console.log("[SERVER] Recent articles count:", recentArticles?.length || 0)

    const stats: DashboardStats = {
      totalArticles: totalArticles || 0,
      publishedArticles: publishedArticles || 0,
      totalUsers: totalUsers || 0,
      recentArticles: recentArticles || [],
    }

    console.log("[SERVER] === DEBUG: Dashboard stats fetched successfully ===")
    console.log("[SERVER] Stats:", JSON.stringify(stats, null, 2))

    return { success: true, data: stats }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in getDashboardStats ===")
    console.log("[SERVER] Error message:", error instanceof Error ? error.message : String(error))
    console.log("[SERVER] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return {
      success: false,
      error: error instanceof Error ? error.message : "ダッシュボード統計の取得に失敗しました",
    }
  }
}
