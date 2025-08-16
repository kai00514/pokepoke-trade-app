"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ArticleBlock {
  id: string
  type: string
  data: any
  order: number
}

export interface Article {
  id?: string
  title: string
  slug: string
  category: string
  is_published: boolean
  pinned: boolean
  thumbnail_image_url?: string
  excerpt?: string
  blocks: ArticleBlock[]
  created_at?: string
  updated_at?: string
}

export async function createArticle(article: Omit<Article, "id">) {
  const supabase = await createClient()

  try {
    // デバッグ: 現在のユーザー情報を確認
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    console.log("=== DEBUG: Current user info ===")
    console.log("User:", user?.id)
    console.log("User email:", user?.email)
    console.log("User metadata:", user?.user_metadata)
    console.log("User error:", userError)

    if (!user) {
      console.log("ERROR: No authenticated user found")
      throw new Error("認証されていません")
    }

    // デバッグ: 管理者権限を確認
    const { data: adminCheck, error: adminError } = await supabase
      .from("auth.users")
      .select("raw_user_meta_data")
      .eq("id", user.id)
      .single()

    console.log("=== DEBUG: Admin check ===")
    console.log("Admin check data:", adminCheck)
    console.log("Admin check error:", adminError)

    // デバッグ: 挿入しようとするデータを確認
    const insertData = {
      title: article.title,
      slug: article.slug,
      category: article.category,
      is_published: article.is_published,
      pinned: article.pinned,
      thumbnail_image_url: article.thumbnail_image_url,
      excerpt: article.excerpt,
    }
    console.log("=== DEBUG: Insert data ===")
    console.log("Insert data:", JSON.stringify(insertData, null, 2))

    // デバッグ: テーブルの構造を確認
    const { data: tableInfo, error: tableError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "info_articles")
      .eq("table_schema", "public")

    console.log("=== DEBUG: Table structure ===")
    console.log("Table info:", tableInfo)
    console.log("Table error:", tableError)

    // 1. 記事メタデータを info_articles テーブルに挿入
    console.log("=== DEBUG: Attempting to insert article ===")
    const { data: articleData, error: articleError } = await supabase
      .from("info_articles")
      .insert(insertData)
      .select()
      .single()

    console.log("=== DEBUG: Insert result ===")
    console.log("Article data:", articleData)
    console.log("Article error:", articleError)
    console.log("Article error details:", articleError?.details)
    console.log("Article error hint:", articleError?.hint)
    console.log("Article error message:", articleError?.message)

    if (articleError) {
      console.error("Error creating article:", articleError)
      throw new Error("記事の作成に失敗しました")
    }

    // 2. ブロックを info_article_blocks テーブルに挿入
    if (article.blocks && article.blocks.length > 0) {
      const blocksToInsert = article.blocks.map((block, index) => ({
        article_id: articleData.id,
        type: block.type,
        display_order: (index + 1) * 10, // 10, 20, 30... の順序
        data: block.data,
      }))

      console.log("=== DEBUG: Blocks to insert ===")
      console.log("Blocks data:", JSON.stringify(blocksToInsert, null, 2))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      console.log("=== DEBUG: Blocks insert result ===")
      console.log("Blocks error:", blocksError)

      if (blocksError) {
        console.error("Error creating blocks:", blocksError)
        // 記事は作成されたがブロックの作成に失敗した場合、記事を削除
        await supabase.from("info_articles").delete().eq("id", articleData.id)
        throw new Error("ブロックの作成に失敗しました")
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    console.log("=== DEBUG: Article created successfully ===")
    return { success: true, data: articleData }
  } catch (error) {
    console.error("Error in createArticle:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return { success: false, error: "記事の作成に失敗しました" }
  }
}

export async function updateArticle(id: string, article: Partial<Article>) {
  const supabase = await createClient()

  try {
    // 1. 記事メタデータを更新
    const { data: articleData, error: articleError } = await supabase
      .from("info_articles")
      .update({
        title: article.title,
        slug: article.slug,
        category: article.category,
        is_published: article.is_published,
        pinned: article.pinned,
        thumbnail_image_url: article.thumbnail_image_url,
        excerpt: article.excerpt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (articleError) {
      console.error("Error updating article:", articleError)
      throw new Error("記事の更新に失敗しました")
    }

    // 2. 既存のブロックを削除
    const { error: deleteError } = await supabase.from("info_article_blocks").delete().eq("article_id", id)

    if (deleteError) {
      console.error("Error deleting existing blocks:", deleteError)
      throw new Error("既存ブロックの削除に失敗しました")
    }

    // 3. 新しいブロックを挿入
    if (article.blocks && article.blocks.length > 0) {
      const blocksToInsert = article.blocks.map((block, index) => ({
        article_id: id,
        type: block.type,
        display_order: (index + 1) * 10,
        data: block.data,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Error creating new blocks:", blocksError)
        throw new Error("新しいブロックの作成に失敗しました")
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")
    revalidatePath(`/info/${articleData.slug}`)

    return { success: true, data: articleData }
  } catch (error) {
    console.error("Error in updateArticle:", error)
    return { success: false, error: "記事の更新に失敗しました" }
  }
}

export async function deleteArticle(id: string) {
  const supabase = await createClient()

  try {
    // CASCADE制約により、ブロックも自動的に削除される
    const { error } = await supabase.from("info_articles").delete().eq("id", id)

    if (error) {
      console.error("Error deleting article:", error)
      throw new Error("記事の削除に失敗しました")
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteArticle:", error)
    return { success: false, error: "記事の削除に失敗しました" }
  }
}

export async function getArticles(page = 1, limit = 10, search = "", category = "") {
  const supabase = await createClient()

  try {
    let query = supabase.from("info_articles").select("*", { count: "exact" }).order("created_at", { ascending: false })

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("Error fetching articles:", error)
      throw new Error("記事の取得に失敗しました")
    }

    return {
      success: true,
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    }
  } catch (error) {
    console.error("Error in getArticles:", error)
    return { success: false, error: "記事の取得に失敗しました" }
  }
}

export async function getArticleById(id: string) {
  const supabase = await createClient()

  try {
    // 記事データを取得
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("id", id)
      .single()

    if (articleError) {
      console.error("Error fetching article:", articleError)
      throw new Error("記事の取得に失敗しました")
    }

    // ブロックデータを取得
    const { data: blocks, error: blocksError } = await supabase
      .from("info_article_blocks")
      .select("*")
      .eq("article_id", id)
      .order("display_order", { ascending: true })

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError)
      throw new Error("ブロックの取得に失敗しました")
    }

    // ブロックデータを Article 形式に変換
    const articleWithBlocks: Article = {
      ...article,
      blocks: blocks.map((block, index) => ({
        id: block.id,
        type: block.type,
        data: block.data,
        order: index,
      })),
    }

    return { success: true, data: articleWithBlocks }
  } catch (error) {
    console.error("Error in getArticleById:", error)
    return { success: false, error: "記事の取得に失敗しました" }
  }
}

export async function getArticleBySlug(slug: string) {
  const supabase = await createClient()

  try {
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("slug", slug)
      .single()

    if (articleError) {
      console.error("Error fetching article by slug:", articleError)
      throw new Error("記事の取得に失敗しました")
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("info_article_blocks")
      .select("*")
      .eq("article_id", article.id)
      .order("display_order", { ascending: true })

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError)
      throw new Error("ブロックの取得に失敗しました")
    }

    const articleWithBlocks: Article = {
      ...article,
      blocks: blocks.map((block, index) => ({
        id: block.id,
        type: block.type,
        data: block.data,
        order: index,
      })),
    }

    return { success: true, data: articleWithBlocks }
  } catch (error) {
    console.error("Error in getArticleBySlug:", error)
    return { success: false, error: "記事の取得に失敗しました" }
  }
}

export async function toggleArticlePublished(id: string, isPublished: boolean) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("info_articles")
      .update({ is_published: isPublished })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error toggling article published status:", error)
      throw new Error("記事の公開状態の変更に失敗しました")
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true, data }
  } catch (error) {
    console.error("Error in toggleArticlePublished:", error)
    return { success: false, error: "記事の公開状態の変更に失敗しました" }
  }
}

export async function toggleArticlePinned(id: string, isPinned: boolean) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("info_articles")
      .update({ pinned: isPinned })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error toggling article pinned status:", error)
      throw new Error("記事のピン留め状態の変更に失敗しました")
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true, data }
  } catch (error) {
    console.error("Error in toggleArticlePinned:", error)
    return { success: false, error: "記事のピン留め状態の変更に失敗しました" }
  }
}
