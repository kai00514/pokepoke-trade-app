"use server"

import "server-only"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ArticleFormData {
  title: string
  excerpt?: string
  content?: string
  thumbnail_image_url?: string
  tags?: string[]
  category?: string
  is_published: boolean
  published_at?: string
  pinned?: boolean
  priority?: number
  slug?: string
}

export interface ArticleBlock {
  type: string
  display_order: number
  data: any
}

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const supabase = await createServerClient()

  // タイトルからスラッグを生成
  let baseSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // 特殊文字を削除
    .replace(/\s+/g, "-") // スペースをハイフンに
    .replace(/-+/g, "-") // 連続するハイフンを1つに
    .replace(/^-|-$/g, "") // 先頭・末尾のハイフンを削除
    .substring(0, 50) // 長さ制限

  if (!baseSlug) {
    baseSlug = "article"
  }

  let slug = baseSlug
  let counter = 1

  while (true) {
    // 重複チェック（更新時は自分自身を除外）
    let query = supabase.from("info_articles").select("id").eq("slug", slug)

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data, error } = await query.single()

    if (error && error.code === "PGRST116") {
      // データが見つからない = 重複なし
      break
    }

    if (error) {
      console.error("Slug check error:", error)
      break
    }

    if (!data) {
      break
    }

    // 重複がある場合は番号を付加
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export async function createArticle(formData: ArticleFormData, blocks: ArticleBlock[]) {
  try {
    const supabase = await createServerClient()

    // スラッグを生成
    const slug = await generateUniqueSlug(formData.title)

    // 記事を作成
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .insert({
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        thumbnail_image_url: formData.thumbnail_image_url,
        tags: formData.tags,
        category: formData.category,
        is_published: formData.is_published,
        published_at: formData.published_at || new Date().toISOString(),
        pinned: formData.pinned || false,
        priority: formData.priority || 0,
        slug: slug,
      })
      .select()
      .single()

    if (articleError) {
      console.error("Article creation error:", articleError)
      throw new Error(`記事の作成に失敗しました: ${articleError.message}`)
    }

    // ブロックを作成
    if (blocks.length > 0) {
      const blocksToInsert = blocks.map((block, index) => ({
        article_id: article.id,
        type: block.type,
        display_order: block.display_order || index,
        data: block.data,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Blocks creation error:", blocksError)
        // 記事を削除してロールバック
        await supabase.from("info_articles").delete().eq("id", article.id)
        throw new Error(`ブロックの作成に失敗しました: ${blocksError.message}`)
      }
    }

    // キャッシュを更新
    revalidatePath("/admin/articles")
    revalidatePath("/info")
    revalidatePath(`/info/${article.id}`)

    return { success: true, article }
  } catch (error) {
    console.error("Create article error:", error)
    throw error
  }
}

export async function updateArticle(id: string, formData: ArticleFormData, blocks: ArticleBlock[]) {
  try {
    const supabase = await createServerClient()

    // スラッグを生成（更新時は自分自身を除外）
    const slug = await generateUniqueSlug(formData.title, id)

    // 記事を更新
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .update({
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        thumbnail_image_url: formData.thumbnail_image_url,
        tags: formData.tags,
        category: formData.category,
        is_published: formData.is_published,
        published_at: formData.published_at,
        pinned: formData.pinned || false,
        priority: formData.priority || 0,
        slug: slug,
        updated_at: new Date().toISOString(),
      })
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
    if (blocks.length > 0) {
      const blocksToInsert = blocks.map((block, index) => ({
        article_id: id,
        type: block.type,
        display_order: block.display_order || index,
        data: block.data,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Blocks creation error:", blocksError)
        throw new Error(`ブロックの作成に失敗しました: ${blocksError.message}`)
      }
    }

    // キャッシュを更新
    revalidatePath("/admin/articles")
    revalidatePath("/info")
    revalidatePath(`/info/${id}`)

    return { success: true, article }
  } catch (error) {
    console.error("Update article error:", error)
    throw error
  }
}

export async function deleteArticle(id: string) {
  try {
    const supabase = await createServerClient()

    // ブロックを削除
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

    // キャッシュを更新
    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true }
  } catch (error) {
    console.error("Delete article error:", error)
    throw error
  }
}

export async function getArticleById(id: string) {
  try {
    const supabase = await createServerClient()

    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("id", id)
      .single()

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

    return { article, blocks: blocks || [] }
  } catch (error) {
    console.error("Get article error:", error)
    throw error
  }
}

export async function getArticlesList(page = 1, limit = 20) {
  try {
    const supabase = await createServerClient()
    const offset = (page - 1) * limit

    const { data: articles, error: articlesError } = await supabase
      .from("info_articles")
      .select("id, title, excerpt, category, is_published, published_at, created_at, updated_at, pinned, priority")
      .order("pinned", { ascending: false })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (articlesError) {
      throw new Error(`記事一覧の取得に失敗しました: ${articlesError.message}`)
    }

    const { count, error: countError } = await supabase
      .from("info_articles")
      .select("*", { count: "exact", head: true })

    if (countError) {
      throw new Error(`記事数の取得に失敗しました: ${countError.message}`)
    }

    return { articles: articles || [], total: count || 0 }
  } catch (error) {
    console.error("Get articles list error:", error)
    throw error
  }
}
