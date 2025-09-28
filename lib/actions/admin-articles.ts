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
  id?: string
  title: string
  slug: string
  content?: string
  status: "draft" | "published"
  published_at?: string
  created_at?: string
  updated_at?: string
  blocks?: Block[]
}

// ブロックの順序を正規化する関数
function normalizeBlockOrders(blocks: Block[]): Block[] {
  return blocks.map((block, index) => ({
    ...block,
    display_order: (index + 1) * 10,
  }))
}

export async function createArticle(article: Omit<Article, "id" | "created_at" | "updated_at">) {
  const supabase = createClient()

  try {
    // 記事を作成
    const { data: articleData, error: articleError } = await supabase
      .from("info_articles")
      .insert({
        title: article.title,
        slug: article.slug,
        status: article.status,
        published_at: article.status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (articleError) {
      console.error("Article creation error:", articleError)
      throw new Error(`記事の作成に失敗しました: ${articleError.message}`)
    }

    // ブロックがある場合は作成
    if (article.blocks && article.blocks.length > 0) {
      const normalizedBlocks = normalizeBlockOrders(article.blocks)

      const blocksToInsert = normalizedBlocks.map((block) => ({
        article_id: articleData.id,
        type: block.type,
        data: block.data,
        display_order: block.display_order,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Blocks creation error:", blocksError)
        throw new Error(`ブロックの作成に失敗しました: ${blocksError.message}`)
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true, data: articleData }
  } catch (error) {
    console.error("Create article error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の作成に失敗しました",
    }
  }
}

export async function updateArticle(id: string, article: Partial<Article>) {
  const supabase = createClient()

  try {
    // 記事を更新
    const updateData: any = {
      title: article.title,
      slug: article.slug,
      status: article.status,
      updated_at: new Date().toISOString(),
    }

    if (article.status === "published" && !article.published_at) {
      updateData.published_at = new Date().toISOString()
    }

    const { data: articleData, error: articleError } = await supabase
      .from("info_articles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (articleError) {
      console.error("Article update error:", articleError)
      throw new Error(`記事の更新に失敗しました: ${articleError.message}`)
    }

    // 既存のブロックを削除
    const { error: deleteError } = await supabase.from("info_article_blocks").delete().eq("article_id", id)

    if (deleteError) {
      console.error("Blocks deletion error:", deleteError)
      throw new Error(`既存ブロックの削除に失敗しました: ${deleteError.message}`)
    }

    // 新しいブロックを作成
    if (article.blocks && article.blocks.length > 0) {
      const normalizedBlocks = normalizeBlockOrders(article.blocks)

      const blocksToInsert = normalizedBlocks.map((block) => ({
        article_id: id,
        type: block.type,
        data: block.data,
        display_order: block.display_order,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Blocks creation error:", blocksError)
        throw new Error(`ブロックの作成に失敗しました: ${blocksError.message}`)
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")
    revalidatePath(`/info/${id}`)

    return { success: true, data: articleData }
  } catch (error) {
    console.error("Update article error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の更新に失敗しました",
    }
  }
}

export async function deleteArticle(id: string) {
  const supabase = createClient()

  try {
    // ブロックを先に削除
    const { error: blocksError } = await supabase.from("info_article_blocks").delete().eq("article_id", id)

    if (blocksError) {
      console.error("Blocks deletion error:", blocksError)
      throw new Error(`ブロックの削除に失敗しました: ${blocksError.message}`)
    }

    // 記事を削除
    const { error: articleError } = await supabase.from("info_articles").delete().eq("id", id)

    if (articleError) {
      console.error("Article deletion error:", articleError)
      throw new Error(`記事の削除に失敗しました: ${articleError.message}`)
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true }
  } catch (error) {
    console.error("Delete article error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の削除に失敗しました",
    }
  }
}

export async function getArticles() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("info_articles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Get articles error:", error)
      throw new Error(`記事の取得に失敗しました: ${error.message}`)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get articles error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の取得に失敗しました",
      data: [],
    }
  }
}

export async function getArticle(id: string) {
  const supabase = createClient()

  try {
    // 記事を取得
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("id", id)
      .single()

    if (articleError) {
      console.error("Get article error:", articleError)
      throw new Error(`記事の取得に失敗しました: ${articleError.message}`)
    }

    // ブロックを取得
    const { data: blocks, error: blocksError } = await supabase
      .from("info_article_blocks")
      .select("*")
      .eq("article_id", id)
      .order("display_order", { ascending: true })

    if (blocksError) {
      console.error("Get blocks error:", blocksError)
      throw new Error(`ブロックの取得に失敗しました: ${blocksError.message}`)
    }

    return {
      success: true,
      data: {
        ...article,
        blocks: blocks || [],
      },
    }
  } catch (error) {
    console.error("Get article error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の取得に失敗しました",
      data: null,
    }
  }
}

export async function getPublishedArticles() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("info_articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })

    if (error) {
      console.error("Get published articles error:", error)
      throw new Error(`公開記事の取得に失敗しました: ${error.message}`)
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get published articles error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "公開記事の取得に失敗しました",
      data: [],
    }
  }
}

export async function getPublishedArticleWithBlocks(id: string) {
  const supabase = createClient()

  try {
    // 公開記事を取得
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .single()

    if (articleError) {
      console.error("Get published article error:", articleError)
      throw new Error(`公開記事の取得に失敗しました: ${articleError.message}`)
    }

    // ブロックを取得
    const { data: blocks, error: blocksError } = await supabase
      .from("info_article_blocks")
      .select("*")
      .eq("article_id", id)
      .order("display_order", { ascending: true })

    if (blocksError) {
      console.error("Get blocks error:", blocksError)
      throw new Error(`ブロックの取得に失敗しました: ${blocksError.message}`)
    }

    return {
      success: true,
      data: {
        ...article,
        blocks: blocks || [],
      },
    }
  } catch (error) {
    console.error("Get published article error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "公開記事の取得に失敗しました",
      data: null,
    }
  }
}
