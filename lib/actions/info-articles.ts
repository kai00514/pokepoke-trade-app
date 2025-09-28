"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const ALLOWED_BLOCK_TYPES = [
  "heading",
  "paragraph",
  "rich-text",
  "image",
  "list",
  "table",
  "flexible-table",
  "key-value-table",
  "callout",
  "toc",
  "divider",
  "related-links",
  "evaluation",
  "cards-table",
  "card-display-table",
  "media-gallery",
  "pickup",
  "button",
] as const

type BlockType = (typeof ALLOWED_BLOCK_TYPES)[number]

interface ArticleBlock {
  id?: string
  type: BlockType
  data: any
  order_index: number
}

interface ArticleData {
  title: string
  slug: string
  excerpt?: string
  featured_image_url?: string
  status: "draft" | "published"
  published_at?: string
  blocks: ArticleBlock[]
}

function validateBlockType(type: string): type is BlockType {
  return ALLOWED_BLOCK_TYPES.includes(type as BlockType)
}

function validateBlockData(block: ArticleBlock): boolean {
  if (!validateBlockType(block.type)) {
    console.error(`Invalid block type: ${block.type}`)
    return false
  }

  // 基本的なデータ構造の検証
  switch (block.type) {
    case "heading":
      return (
        typeof block.data?.text === "string" &&
        typeof block.data?.level === "number" &&
        block.data.level >= 1 &&
        block.data.level <= 6
      )

    case "paragraph":
    case "rich-text":
      return typeof block.data?.text === "string" || typeof block.data?.html === "string"

    case "image":
      return typeof block.data?.url === "string"

    case "list":
      return Array.isArray(block.data?.items) && typeof block.data?.ordered === "boolean"

    case "table":
      return Array.isArray(block.data?.headers) && Array.isArray(block.data?.rows)

    case "flexible-table":
      return Array.isArray(block.data?.columns) && Array.isArray(block.data?.rows)

    case "key-value-table":
      return (
        Array.isArray(block.data?.items) &&
        block.data.items.every(
          (item: any) =>
            typeof item.key === "string" && (typeof item.value === "string" || Array.isArray(item.cardValues)),
        )
      )

    case "cards-table":
    case "card-display-table":
      return Array.isArray(block.data?.items) && block.data.items.every((item: any) => typeof item.card_id === "number")

    case "callout":
      return typeof block.data?.text === "string" && ["info", "warning", "error", "success"].includes(block.data?.type)

    case "pickup":
      return Array.isArray(block.data?.items)

    case "button":
      return typeof block.data?.text === "string"

    default:
      return true // その他のブロックタイプは基本的な構造チェックのみ
  }
}

export async function createArticle(articleData: ArticleData) {
  try {
    const supabase = createClient()

    // ブロックデータの検証
    for (const block of articleData.blocks) {
      if (!validateBlockData(block)) {
        throw new Error(`Invalid block data for type: ${block.type}`)
      }
    }

    // 記事を作成
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .insert({
        title: articleData.title,
        slug: articleData.slug,
        excerpt: articleData.excerpt,
        featured_image_url: articleData.featured_image_url,
        status: articleData.status,
        published_at: articleData.published_at,
      })
      .select()
      .single()

    if (articleError) {
      console.error("Article creation error:", articleError)
      throw new Error(`記事の作成に失敗しました: ${articleError.message}`)
    }

    // ブロックを作成
    if (articleData.blocks.length > 0) {
      const blocksToInsert = articleData.blocks.map((block) => ({
        article_id: article.id,
        type: block.type,
        data: block.data,
        order_index: block.order_index,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

      if (blocksError) {
        console.error("Blocks creation error:", blocksError)
        // 記事を削除してロールバック
        await supabase.from("info_articles").delete().eq("id", article.id)
        throw new Error(`ブロックの作成に失敗しました: ${blocksError.message}`)
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")

    return { success: true, article }
  } catch (error) {
    console.error("Create article error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の作成に失敗しました",
    }
  }
}

export async function updateArticle(articleId: string, articleData: Partial<ArticleData>) {
  try {
    const supabase = createClient()

    // ブロックデータの検証
    if (articleData.blocks) {
      for (const block of articleData.blocks) {
        if (!validateBlockData(block)) {
          throw new Error(`Invalid block data for type: ${block.type}`)
        }
      }
    }

    // 記事を更新
    const updateData: any = {}
    if (articleData.title !== undefined) updateData.title = articleData.title
    if (articleData.slug !== undefined) updateData.slug = articleData.slug
    if (articleData.excerpt !== undefined) updateData.excerpt = articleData.excerpt
    if (articleData.featured_image_url !== undefined) updateData.featured_image_url = articleData.featured_image_url
    if (articleData.status !== undefined) updateData.status = articleData.status
    if (articleData.published_at !== undefined) updateData.published_at = articleData.published_at

    const { error: articleError } = await supabase.from("info_articles").update(updateData).eq("id", articleId)

    if (articleError) {
      console.error("Article update error:", articleError)
      throw new Error(`記事の更新に失敗しました: ${articleError.message}`)
    }

    // ブロックを更新（指定された場合）
    if (articleData.blocks) {
      // 既存のブロックを削除
      const { error: deleteError } = await supabase.from("info_article_blocks").delete().eq("article_id", articleId)

      if (deleteError) {
        console.error("Blocks deletion error:", deleteError)
        throw new Error(`既存ブロックの削除に失敗しました: ${deleteError.message}`)
      }

      // 新しいブロックを挿入
      if (articleData.blocks.length > 0) {
        const blocksToInsert = articleData.blocks.map((block) => ({
          article_id: articleId,
          type: block.type,
          data: block.data,
          order_index: block.order_index,
        }))

        const { error: blocksError } = await supabase.from("info_article_blocks").insert(blocksToInsert)

        if (blocksError) {
          console.error("Blocks creation error:", blocksError)
          throw new Error(`ブロックの作成に失敗しました: ${blocksError.message}`)
        }
      }
    }

    revalidatePath("/admin/articles")
    revalidatePath("/info")
    revalidatePath(`/info/${articleId}`)

    return { success: true }
  } catch (error) {
    console.error("Update article error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の更新に失敗しました",
    }
  }
}

export async function deleteArticle(articleId: string) {
  try {
    const supabase = createClient()

    // ブロックを先に削除
    const { error: blocksError } = await supabase.from("info_article_blocks").delete().eq("article_id", articleId)

    if (blocksError) {
      console.error("Blocks deletion error:", blocksError)
      throw new Error(`ブロックの削除に失敗しました: ${blocksError.message}`)
    }

    // 記事を削除
    const { error: articleError } = await supabase.from("info_articles").delete().eq("id", articleId)

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

export async function getArticle(articleId: string) {
  try {
    const supabase = createClient()

    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("id", articleId)
      .single()

    if (articleError) {
      console.error("Article fetch error:", articleError)
      throw new Error(`記事の取得に失敗しました: ${articleError.message}`)
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("info_article_blocks")
      .select("*")
      .eq("article_id", articleId)
      .order("order_index")

    if (blocksError) {
      console.error("Blocks fetch error:", blocksError)
      throw new Error(`ブロックの取得に失敗しました: ${blocksError.message}`)
    }

    return {
      success: true,
      article: {
        ...article,
        blocks: blocks || [],
      },
    }
  } catch (error) {
    console.error("Get article error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の取得に失敗しました",
    }
  }
}

export async function getArticles(status?: "draft" | "published") {
  try {
    const supabase = createClient()

    let query = supabase
      .from("info_articles")
      .select("id, title, slug, excerpt, featured_image_url, status, published_at, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: articles, error } = await query

    if (error) {
      console.error("Articles fetch error:", error)
      throw new Error(`記事一覧の取得に失敗しました: ${error.message}`)
    }

    return { success: true, articles: articles || [] }
  } catch (error) {
    console.error("Get articles error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "記事一覧の取得に失敗しました",
    }
  }
}
