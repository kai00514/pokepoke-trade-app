"use server"

import "server-only"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ArticleFormData = {
  title: string
  excerpt?: string
  thumbnail_image_url?: string
  tags?: string[]
  category?: string
  is_published: boolean
  published_at?: string
  pinned?: boolean
  priority?: number
  slug?: string
  blocks: Array<{
    type: string
    display_order: number
    data: any
  }>
}

async function supabaseServer() {
  return await createServerClient()
}

// ブロックの順序を正規化する関数
function normalizeBlockOrders(blocks: Array<{ type: string; display_order: number; data: any }>) {
  return blocks
    .sort((a, b) => a.display_order - b.display_order)
    .map((block, index) => ({
      ...block,
      display_order: (index + 1) * 10, // 10, 20, 30, ... の順序で設定
    }))
}

export async function createArticle(
  formData: ArticleFormData,
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const supabase = await supabaseServer()

    // ブロックの順序を正規化
    const normalizedBlocks = normalizeBlockOrders(formData.blocks)

    // 記事を作成
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .insert({
        title: formData.title,
        excerpt: formData.excerpt,
        thumbnail_image_url: formData.thumbnail_image_url,
        tags: formData.tags,
        category: formData.category,
        is_published: formData.is_published,
        published_at: formData.published_at || new Date().toISOString(),
        pinned: formData.pinned || false,
        priority: formData.priority || 0,
        slug: formData.slug,
      })
      .select("id")
      .single()

    if (articleError) {
      console.error("Article creation error:", articleError)
      return { success: false, error: `記事の作成に失敗しました: ${articleError.message}` }
    }

    // ブロックを作成
    if (normalizedBlocks.length > 0) {
      const blocksToInsert = normalizedBlocks.map((block) => ({
        article_id: article.id,
        type: block.type,
        display_order: block.display_order,
        data: block.data,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Blocks creation error:", blocksError)
        // 記事を削除してロールバック
        await supabase.from("info_articles").delete().eq("id", article.id)
        return { success: false, error: `ブロックの作成に失敗しました: ${blocksError.message}` }
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true, id: article.id }
  } catch (error) {
    console.error("Unexpected error in createArticle:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function updateArticle(
  id: string,
  formData: ArticleFormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer()

    // ブロックの順序を正規化
    const normalizedBlocks = normalizeBlockOrders(formData.blocks)

    // 記事を更新
    const { error: articleError } = await supabase
      .from("info_articles")
      .update({
        title: formData.title,
        excerpt: formData.excerpt,
        thumbnail_image_url: formData.thumbnail_image_url,
        tags: formData.tags,
        category: formData.category,
        is_published: formData.is_published,
        published_at: formData.published_at,
        pinned: formData.pinned || false,
        priority: formData.priority || 0,
        slug: formData.slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (articleError) {
      console.error("Article update error:", articleError)
      return { success: false, error: `記事の更新に失敗しました: ${articleError.message}` }
    }

    // 既存のブロックを削除
    const { error: deleteError } = await supabase.from("info_article_blocks").delete().eq("article_id", id)

    if (deleteError) {
      console.error("Blocks deletion error:", deleteError)
      return { success: false, error: `既存ブロックの削除に失敗しました: ${deleteError.message}` }
    }

    // 新しいブロックを作成
    if (normalizedBlocks.length > 0) {
      const blocksToInsert = normalizedBlocks.map((block) => ({
        article_id: id,
        type: block.type,
        display_order: block.display_order,
        data: block.data,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Blocks creation error:", blocksError)
        return { success: false, error: `ブロックの作成に失敗しました: ${blocksError.message}` }
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")
    revalidatePath(`/info/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in updateArticle:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function deleteArticle(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer()

    // ブロックを削除
    const { error: blocksError } = await supabase.from("info_article_blocks").delete().eq("article_id", id)

    if (blocksError) {
      console.error("Blocks deletion error:", blocksError)
      return { success: false, error: `ブロックの削除に失敗しました: ${blocksError.message}` }
    }

    // 記事を削除
    const { error: articleError } = await supabase.from("info_articles").delete().eq("id", id)

    if (articleError) {
      console.error("Article deletion error:", articleError)
      return { success: false, error: `記事の削除に失敗しました: ${articleError.message}` }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteArticle:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function getArticleById(id: string) {
  const supabase = await supabaseServer()

  const { data: article, error: articleError } = await supabase.from("info_articles").select("*").eq("id", id).single()

  if (articleError) {
    throw new Error(`記事の取得に失敗しました: ${articleError.message}`)
  }

  const { data: blocks, error: blocksError } = await supabase
    .from("info_article_blocks")
    .select("*")
    .eq("article_id", id)
    .order("display_order", { ascending: true })

  if (blocksError) {
    throw new Error(`ブロックの取得に失敗しました: ${blocksError.message}`)
  }

  return {
    ...article,
    blocks: blocks || [],
  }
}

export async function getArticlesList(limit = 20, offset = 0) {
  const supabase = await supabaseServer()

  const { data, error } = await supabase
    .from("info_articles")
    .select(
      "id, title, excerpt, thumbnail_image_url, tags, category, is_published, published_at, pinned, priority, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`記事一覧の取得に失敗しました: ${error.message}`)
  }

  return data || []
}

export async function logoutAdmin(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await supabaseServer()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "ログアウトに失敗しました" }
  }
}
