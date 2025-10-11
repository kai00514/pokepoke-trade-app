"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ArticleBlock {
  id?: string
  type: string
  data: any
  display_order: number
}

export interface CreateArticleData {
  title: string
  slug: string
  category: string
  is_published: boolean
  pinned: boolean
  priority: number
  thumbnail_image_url?: string
  hero_image_url?: string
  excerpt?: string
  subtitle?: string
  tags?: string[]
  blocks: ArticleBlock[]
}

export interface Article extends CreateArticleData {
  id: string
  created_at: string
  updated_at: string
  view_count: number
  published_at?: string
}

// ブロックの順序を正規化する関数
function normalizeBlockOrders(blocks: ArticleBlock[]): ArticleBlock[] {
  return blocks
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    .map((block, index) => ({
      ...block,
      display_order: (index + 1) * 10,
    }))
}

export async function createArticle(articleData: CreateArticleData) {
  try {
    const supabase = await createClient()

    if (!articleData.title || !articleData.slug) {
      return { success: false, error: "タイトルとスラッグは必須です" }
    }

    // スラッグの重複チェック
    const { data: existingArticle } = await supabase
      .from("info_articles")
      .select("id")
      .eq("slug", articleData.slug)
      .single()

    if (existingArticle) {
      return { success: false, error: "このスラッグは既に使用されています" }
    }

    // 記事を作成
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .insert({
        title: articleData.title,
        slug: articleData.slug,
        category: articleData.category,
        is_published: articleData.is_published,
        pinned: articleData.pinned,
        priority: articleData.priority,
        thumbnail_image_url: articleData.thumbnail_image_url,
        hero_image_url: articleData.hero_image_url,
        excerpt: articleData.excerpt,
        subtitle: articleData.subtitle,
        tags: articleData.tags,
        published_at: articleData.is_published ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (articleError) {
      console.error("Error creating article:", articleError)
      return { success: false, error: "記事の作成に失敗しました: " + articleError.message }
    }

    // ブロックを作成
    if (articleData.blocks && articleData.blocks.length > 0) {
      const normalizedBlocks = normalizeBlockOrders(articleData.blocks)
      const blocksToInsert = normalizedBlocks.map((block, index) => ({
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

    return { success: true, data: article }
  } catch (error) {
    console.error("Error in createArticle:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function updateArticle(id: string, articleData: CreateArticleData) {
  try {
    const supabase = await createClient()

    if (!articleData.title || !articleData.slug) {
      return { success: false, error: "タイトルとスラッグは必須です" }
    }

    // スラッグの重複チェック（自分以外）
    const { data: existingArticle } = await supabase
      .from("info_articles")
      .select("id")
      .eq("slug", articleData.slug)
      .neq("id", id)
      .single()

    if (existingArticle) {
      return { success: false, error: "このスラッグは既に使用されています" }
    }

    // 記事を更新
    const { error: articleError } = await supabase
      .from("info_articles")
      .update({
        title: articleData.title,
        slug: articleData.slug,
        category: articleData.category,
        is_published: articleData.is_published,
        pinned: articleData.pinned,
        priority: articleData.priority,
        thumbnail_image_url: articleData.thumbnail_image_url,
        hero_image_url: articleData.hero_image_url,
        excerpt: articleData.excerpt,
        subtitle: articleData.subtitle,
        tags: articleData.tags,
        published_at: articleData.is_published ? new Date().toISOString() : null,
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
    if (articleData.blocks && articleData.blocks.length > 0) {
      const normalizedBlocks = normalizeBlockOrders(articleData.blocks)
      const blocksToInsert = normalizedBlocks.map((block, index) => ({
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

export async function deleteArticle(id: string) {
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

export async function getArticles() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("info_articles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching articles:", error)
      return { success: false, error: "記事の取得に失敗しました", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error in getArticles:", error)
    return { success: false, error: "予期しないエラーが発生しました", data: [] }
  }
}

export async function getArticle(id: string) {
  try {
    const supabase = await createClient()

    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("id", id)
      .single()

    if (articleError) {
      console.error("Error fetching article:", articleError)
      return { success: false, error: "記事の取得に失敗しました", data: null }
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("info_article_blocks")
      .select("*")
      .eq("article_id", id)
      .order("display_order", { ascending: true })

    if (blocksError) {
      console.error("Error fetching blocks:", blocksError)
      return { success: false, error: "ブロックの取得に失敗しました", data: article }
    }

    return {
      success: true,
      data: {
        ...article,
        blocks: blocks || [],
      },
    }
  } catch (error) {
    console.error("Error in getArticle:", error)
    return { success: false, error: "予期しないエラーが発生しました", data: null }
  }
}

export const getArticleById = getArticle

export async function toggleArticlePublished(id: string, isPublished: boolean) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("info_articles")
      .update({
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error toggling article published status:", error)
      return { success: false, error: "公開状態の変更に失敗しました" }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true }
  } catch (error) {
    console.error("Error in toggleArticlePublished:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function toggleArticlePinned(id: string, isPinned: boolean) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("info_articles")
      .update({
        pinned: isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error toggling article pinned status:", error)
      return { success: false, error: "ピン留め状態の変更に失敗しました" }
    }

    revalidatePath("/admin/articles")

    return { success: true }
  } catch (error) {
    console.error("Error in toggleArticlePinned:", error)
    return { success: false, error: "予期しないエラーが発生しました" }
  }
}

export async function getPublishedArticles() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("info_articles")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })

    if (error) {
      console.error("Error fetching published articles:", error)
      return { success: false, error: "公開記事の取得に失敗しました", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Error in getPublishedArticles:", error)
    return { success: false, error: "予期しないエラーが発生しました", data: [] }
  }
}
