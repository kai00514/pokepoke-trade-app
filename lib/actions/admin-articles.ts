"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Block {
  id?: string
  type: string
  data: any
  display_order: number
}

export interface Article {
  id?: number
  title: string
  slug: string
  content?: string
  excerpt?: string
  featured_image?: string
  status: "draft" | "published"
  published_at?: string
  created_at?: string
  updated_at?: string
  blocks?: Block[]
}

// ブロックの順序を正規化する関数
function normalizeBlockOrders(blocks: Block[]): Block[] {
  return blocks
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .map((block, index) => ({
      ...block,
      display_order: (index + 1) * 10,
    }))
}

export async function createArticle(formData: FormData): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const supabase = await createClient()

    const title = formData.get("title") as string
    const slug = formData.get("slug") as string
    const excerpt = formData.get("excerpt") as string
    const featuredImage = formData.get("featured_image") as string
    const status = formData.get("status") as "draft" | "published"
    const blocksData = formData.get("blocks") as string

    if (!title || !slug) {
      return { success: false, error: "タイトルとスラッグは必須です" }
    }

    // スラッグの重複チェック
    const { data: existingArticle } = await supabase.from("info_articles").select("id").eq("slug", slug).single()

    if (existingArticle) {
      return { success: false, error: "このスラッグは既に使用されています" }
    }

    let blocks: Block[] = []
    if (blocksData) {
      try {
        blocks = JSON.parse(blocksData)
        // ブロックの順序を正規化
        blocks = normalizeBlockOrders(blocks)
      } catch (error) {
        console.error("Error parsing blocks:", error)
        return { success: false, error: "ブロックデータの解析に失敗しました" }
      }
    }

    // 記事を作成
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .insert({
        title,
        slug,
        excerpt,
        featured_image: featuredImage || null,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (articleError) {
      console.error("Error creating article:", articleError)
      return { success: false, error: "記事の作成に失敗しました: " + articleError.message }
    }

    // ブロックを作成
    if (blocks.length > 0) {
      const blocksToInsert = blocks.map((block, index) => ({
        article_id: article.id,
        type: block.type,
        data: block.data,
        display_order: block.display_order || (index + 1) * 10,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Error creating blocks:", blocksError)
        // 記事は作成されたが、ブロックの作成に失敗した場合は記事を削除
        await supabase.from("info_articles").delete().eq("id", article.id)
        return { success: false, error: "ブロックの作成に失敗しました: " + blocksError.message }
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true, id: article.id }
  } catch (error) {
    console.error("Error in createArticle:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function updateArticle(id: number, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const title = formData.get("title") as string
    const slug = formData.get("slug") as string
    const excerpt = formData.get("excerpt") as string
    const featuredImage = formData.get("featured_image") as string
    const status = formData.get("status") as "draft" | "published"
    const blocksData = formData.get("blocks") as string

    if (!title || !slug) {
      return { success: false, error: "タイトルとスラッグは必須です" }
    }

    // スラッグの重複チェック（自分以外）
    const { data: existingArticle } = await supabase
      .from("info_articles")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .single()

    if (existingArticle) {
      return { success: false, error: "このスラッグは既に使用されています" }
    }

    let blocks: Block[] = []
    if (blocksData) {
      try {
        blocks = JSON.parse(blocksData)
        // ブロックの順序を正規化
        blocks = normalizeBlockOrders(blocks)
      } catch (error) {
        console.error("Error parsing blocks:", error)
        return { success: false, error: "ブロックデータの解析に失敗しました" }
      }
    }

    // 記事を更新
    const { error: articleError } = await supabase
      .from("info_articles")
      .update({
        title,
        slug,
        excerpt,
        featured_image: featuredImage || null,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (articleError) {
      console.error("Error updating article:", articleError)
      return { success: false, error: "記事の更新に失敗しました: " + articleError.message }
    }

    // 既存のブロックを削除
    const { error: deleteError } = await supabase.from("info_article_blocks").delete().eq("article_id", id)

    if (deleteError) {
      console.error("Error deleting existing blocks:", deleteError)
      return { success: false, error: "既存ブロックの削除に失敗しました: " + deleteError.message }
    }

    // 新しいブロックを作成
    if (blocks.length > 0) {
      const blocksToInsert = blocks.map((block, index) => ({
        article_id: id,
        type: block.type,
        data: block.data,
        display_order: block.display_order || (index + 1) * 10,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Error creating blocks:", blocksError)
        return { success: false, error: "ブロックの作成に失敗しました: " + blocksError.message }
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")
    revalidatePath(`/info/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Error in updateArticle:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function deleteArticle(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // ブロックを先に削除
    const { error: blocksError } = await supabase.from("info_article_blocks").delete().eq("article_id", id)

    if (blocksError) {
      console.error("Error deleting blocks:", blocksError)
      return { success: false, error: "ブロックの削除に失敗しました" }
    }

    // 記事を削除
    const { error: articleError } = await supabase.from("info_articles").delete().eq("id", id)

    if (articleError) {
      console.error("Error deleting article:", articleError)
      return { success: false, error: "記事の削除に失敗しました" }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteArticle:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function getArticles(): Promise<Article[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("info_articles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching articles:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getArticles:", error)
    return []
  }
}

export async function getArticle(id: number): Promise<Article | null> {
  try {
    const supabase = await createClient()

    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("id", id)
      .single()

    if (articleError) {
      console.error("Error fetching article:", articleError)
      return null
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("info_article_blocks")
      .select("*")
      .eq("article_id", id)
      .order("display_order", { ascending: true })

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError)
      return article
    }

    return {
      ...article,
      blocks: blocks || [],
    }
  } catch (error) {
    console.error("Error in getArticle:", error)
    return null
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = await createClient()

    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single()

    if (articleError) {
      console.error("Error fetching article by slug:", articleError)
      return null
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("info_article_blocks")
      .select("*")
      .eq("article_id", article.id)
      .order("display_order", { ascending: true })

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError)
      return article
    }

    return {
      ...article,
      blocks: blocks || [],
    }
  } catch (error) {
    console.error("Error in getArticleBySlug:", error)
    return null
  }
}

export async function getPublishedArticles(): Promise<Article[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("info_articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })

    if (error) {
      console.error("Error fetching published articles:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getPublishedArticles:", error)
    return []
  }
}
