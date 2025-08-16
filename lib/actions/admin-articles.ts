"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ArticleBlock {
  type: string
  data: any
  display_order: number
}

export interface CreateArticleData {
  title: string
  slug?: string
  subtitle?: string
  excerpt?: string
  thumbnail_image_url?: string
  hero_image_url?: string
  category: string
  tags?: string[]
  is_published: boolean
  pinned?: boolean
  priority?: number
  blocks: ArticleBlock[]
}

export async function createArticle(articleData: CreateArticleData) {
  console.log("[SERVER] === DEBUG: createArticle function started ===")
  console.log("[SERVER] Input article data:", JSON.stringify(articleData, null, 2))

  try {
    const supabase = await createClient()
    console.log("[SERVER] === DEBUG: Supabase client created ===")

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[SERVER] === DEBUG: Current user info ===")
    console.log("[SERVER] User ID:", user?.id)
    console.log("[SERVER] User email:", user?.email)
    console.log("[SERVER] User error:", userError)

    if (userError) {
      console.log("[SERVER] ERROR: User authentication error:", userError)
      throw new Error("認証エラーが発生しました")
    }

    if (!user) {
      console.log("[SERVER] ERROR: No authenticated user found")
      throw new Error("認証されていません")
    }

    // セッション情報も確認
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    console.log("[SERVER] === DEBUG: Session info ===")
    console.log("[SERVER] Session:", session ? "present" : "missing")
    console.log("[SERVER] Session error:", sessionError)

    // テーブル構造を確認
    console.log("[SERVER] === DEBUG: Checking table structure ===")
    const { data: tableInfo, error: tableError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "info_articles")
      .eq("table_schema", "public")

    console.log("[SERVER] Table structure:", tableInfo)
    console.log("[SERVER] Table error:", tableError)

    // RLSポリシーの確認
    console.log("[SERVER] === DEBUG: Checking RLS policies ===")
    const { data: policies, error: policyError } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "info_articles")

    console.log("[SERVER] RLS policies:", policies)
    console.log("[SERVER] Policy error:", policyError)

    // アクセス権限のテスト
    console.log("[SERVER] === DEBUG: Testing table access ===")
    const { data: testData, error: testError } = await supabase.from("info_articles").select("id").limit(1)

    console.log("[SERVER] Test query result:", testData)
    console.log("[SERVER] Test query error:", testError)

    // 記事データの準備
    const { blocks, ...articleFields } = articleData

    const insertData = {
      ...articleFields,
      author_id: user.id,
      slug: articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, "-"),
      tags: articleData.tags || [],
      pinned: articleData.pinned || false,
      priority: articleData.priority || 0,
    }

    console.log("[SERVER] === DEBUG: Prepared insert data ===")
    console.log("[SERVER] Insert data:", JSON.stringify(insertData, null, 2))

    // データ型の検証
    console.log("[SERVER] === DEBUG: Data type validation ===")
    Object.entries(insertData).forEach(([key, value]) => {
      console.log(`[SERVER] ${key}: ${typeof value} = ${JSON.stringify(value)}`)
    })

    // 記事を挿入
    console.log("[SERVER] === DEBUG: Inserting article ===")
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .insert(insertData)
      .select()
      .single()

    if (articleError) {
      console.log("[SERVER] === DEBUG: Article insertion failed ===")
      console.log("[SERVER] Error code:", articleError.code)
      console.log("[SERVER] Error message:", articleError.message)
      console.log("[SERVER] Error details:", articleError.details)
      console.log("[SERVER] Error hint:", articleError.hint)
      throw new Error(`記事の作成に失敗しました: ${articleError.message}`)
    }

    console.log("[SERVER] === DEBUG: Article created successfully ===")
    console.log("[SERVER] Article ID:", article.id)

    // ブロックを挿入
    if (blocks && blocks.length > 0) {
      console.log("[SERVER] === DEBUG: Inserting blocks ===")
      const blockData = blocks.map((block, index) => ({
        article_id: article.id,
        type: block.type,
        data: block.data,
        display_order: (index + 1) * 10,
      }))

      console.log("[SERVER] Block data:", JSON.stringify(blockData, null, 2))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blockData)

      if (blocksError) {
        console.log("[SERVER] === DEBUG: Block insertion failed ===")
        console.log("[SERVER] Blocks error:", blocksError)
        // 記事は作成されたが、ブロックの挿入に失敗した場合は記事を削除
        await supabase.from("info_articles").delete().eq("id", article.id)
        throw new Error(`ブロックの作成に失敗しました: ${blocksError.message}`)
      }

      console.log("[SERVER] === DEBUG: Blocks created successfully ===")
    }

    // キャッシュを更新
    revalidatePath("/admin/articles")
    revalidatePath("/info")

    console.log("[SERVER] === DEBUG: Article creation completed ===")
    return { success: true, data: article }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in createArticle ===")
    console.log("[SERVER] Error message:", error instanceof Error ? error.message : String(error))
    console.log("[SERVER] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.log("[SERVER] Full error object:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の作成に失敗しました",
    }
  }
}

export async function updateArticle(id: string, articleData: CreateArticleData) {
  console.log("[SERVER] === DEBUG: updateArticle function started ===")
  console.log("[SERVER] Article ID:", id)
  console.log("[SERVER] Update data:", JSON.stringify(articleData, null, 2))

  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    const { blocks, ...articleFields } = articleData

    const updateData = {
      ...articleFields,
      slug: articleData.slug || articleData.title.toLowerCase().replace(/\s+/g, "-"),
      tags: articleData.tags || [],
      pinned: articleData.pinned || false,
      priority: articleData.priority || 0,
      updated_at: new Date().toISOString(),
    }

    // 記事を更新
    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (articleError) {
      throw new Error(`記事の更新に失敗しました: ${articleError.message}`)
    }

    // 既存のブロックを削除
    const { error: deleteError } = await supabase.from("info_article_blocks").delete().eq("article_id", id)

    if (deleteError) {
      throw new Error(`既存ブロックの削除に失敗しました: ${deleteError.message}`)
    }

    // 新しいブロックを挿入
    if (blocks && blocks.length > 0) {
      const blockData = blocks.map((block, index) => ({
        article_id: id,
        type: block.type,
        data: block.data,
        display_order: (index + 1) * 10,
      }))

      const { error: blocksError } = await supabase.from("info_article_blocks").insert(blockData)

      if (blocksError) {
        throw new Error(`ブロックの更新に失敗しました: ${blocksError.message}`)
      }
    }

    // キャッシュを更新
    revalidatePath("/admin/articles")
    revalidatePath("/info")
    revalidatePath(`/info/${article.id}`)

    return { success: true, data: article }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in updateArticle ===")
    console.log("[SERVER] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の更新に失敗しました",
    }
  }
}

export async function deleteArticle(id: string) {
  console.log("[SERVER] === DEBUG: deleteArticle function started ===")
  console.log("[SERVER] Article ID:", id)

  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[SERVER] === DEBUG: Current user for delete ===")
    console.log("[SERVER] User ID:", user?.id)
    console.log("[SERVER] User error:", userError)

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    // 記事を削除（ブロックはCASCADEで自動削除される）
    const { error } = await supabase.from("info_articles").delete().eq("id", id)

    console.log("[SERVER] === DEBUG: Delete operation result ===")
    console.log("[SERVER] Delete error:", error)

    if (error) {
      throw new Error(`記事の削除に失敗しました: ${error.message}`)
    }

    // キャッシュを更新
    revalidatePath("/admin/articles")
    revalidatePath("/info")

    console.log("[SERVER] === DEBUG: Article deleted successfully ===")
    return { success: true }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in deleteArticle ===")
    console.log("[SERVER] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の削除に失敗しました",
    }
  }
}

export async function getArticles() {
  console.log("[SERVER] === DEBUG: getArticles function started ===")

  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[SERVER] === DEBUG: Current user for getArticles ===")
    console.log("[SERVER] User ID:", user?.id)
    console.log("[SERVER] User error:", userError)

    if (userError) {
      console.log("[SERVER] WARNING: User authentication error in getArticles:", userError)
      // 記事一覧の取得は認証なしでも許可する場合があるので、エラーにしない
    }

    console.log("[SERVER] === DEBUG: Fetching articles ===")
    const { data: articles, error } = await supabase
      .from("info_articles")
      .select(`
        id,
        title,
        slug,
        category,
        is_published,
        published_at,
        pinned,
        priority,
        view_count,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    console.log("[SERVER] === DEBUG: Articles fetch result ===")
    console.log("[SERVER] Articles count:", articles?.length || 0)
    console.log("[SERVER] Fetch error:", error)

    if (error) {
      console.log("[SERVER] === DEBUG: Articles fetch failed ===")
      console.log("[SERVER] Error code:", error.code)
      console.log("[SERVER] Error message:", error.message)
      console.log("[SERVER] Error details:", error.details)
      throw new Error(`記事の取得に失敗しました: ${error.message}`)
    }

    console.log("[SERVER] === DEBUG: Articles fetched successfully ===")
    return { success: true, data: articles || [] }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in getArticles ===")
    console.log("[SERVER] Error message:", error instanceof Error ? error.message : String(error))
    console.log("[SERVER] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の取得に失敗しました",
    }
  }
}

export async function getArticleById(id: string) {
  console.log("[SERVER] === DEBUG: getArticleById function started ===")
  console.log("[SERVER] Article ID:", id)

  try {
    const supabase = await createClient()

    const { data: article, error: articleError } = await supabase
      .from("info_articles")
      .select("*")
      .eq("id", id)
      .single()

    console.log("[SERVER] === DEBUG: Article fetch result ===")
    console.log("[SERVER] Article data:", article ? "found" : "not found")
    console.log("[SERVER] Article error:", articleError)

    if (articleError) {
      throw new Error(`記事の取得に失敗しました: ${articleError.message}`)
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("info_article_blocks")
      .select("*")
      .eq("article_id", id)
      .order("display_order")

    console.log("[SERVER] === DEBUG: Blocks fetch result ===")
    console.log("[SERVER] Blocks count:", blocks?.length || 0)
    console.log("[SERVER] Blocks error:", blocksError)

    if (blocksError) {
      throw new Error(`ブロックの取得に失敗しました: ${blocksError.message}`)
    }

    console.log("[SERVER] === DEBUG: Article with blocks fetched successfully ===")
    return {
      success: true,
      data: {
        ...article,
        blocks: blocks || [],
      },
    }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in getArticleById ===")
    console.log("[SERVER] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "記事の取得に失敗しました",
    }
  }
}

export async function toggleArticlePublished(id: string, isPublished: boolean) {
  console.log("[SERVER] === DEBUG: toggleArticlePublished function started ===")
  console.log("[SERVER] Article ID:", id)
  console.log("[SERVER] New published status:", isPublished)

  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[SERVER] === DEBUG: Current user for toggle published ===")
    console.log("[SERVER] User ID:", user?.id)
    console.log("[SERVER] User error:", userError)

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    const { data, error } = await supabase
      .from("info_articles")
      .update({ is_published: isPublished })
      .eq("id", id)
      .select()
      .single()

    console.log("[SERVER] === DEBUG: Toggle published result ===")
    console.log("[SERVER] Updated data:", data ? "success" : "failed")
    console.log("[SERVER] Update error:", error)

    if (error) {
      throw new Error(`公開状態の変更に失敗しました: ${error.message}`)
    }

    // キャッシュを更新
    revalidatePath("/admin/articles")
    revalidatePath("/info")

    console.log("[SERVER] === DEBUG: Article published status toggled successfully ===")
    return { success: true, data }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in toggleArticlePublished ===")
    console.log("[SERVER] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "公開状態の変更に失敗しました",
    }
  }
}

export async function toggleArticlePinned(id: string, isPinned: boolean) {
  console.log("[SERVER] === DEBUG: toggleArticlePinned function started ===")
  console.log("[SERVER] Article ID:", id)
  console.log("[SERVER] New pinned status:", isPinned)

  try {
    const supabase = await createClient()

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("[SERVER] === DEBUG: Current user for toggle pinned ===")
    console.log("[SERVER] User ID:", user?.id)
    console.log("[SERVER] User error:", userError)

    if (userError || !user) {
      throw new Error("認証されていません")
    }

    const { data, error } = await supabase
      .from("info_articles")
      .update({ pinned: isPinned })
      .eq("id", id)
      .select()
      .single()

    console.log("[SERVER] === DEBUG: Toggle pinned result ===")
    console.log("[SERVER] Updated data:", data ? "success" : "failed")
    console.log("[SERVER] Update error:", error)

    if (error) {
      throw new Error(`ピン留め状態の変更に失敗しました: ${error.message}`)
    }

    // キャッシュを更新
    revalidatePath("/admin/articles")
    revalidatePath("/info")

    console.log("[SERVER] === DEBUG: Article pinned status toggled successfully ===")
    return { success: true, data }
  } catch (error) {
    console.log("[SERVER] === DEBUG: Error in toggleArticlePinned ===")
    console.log("[SERVER] Error:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "ピン留め状態の変更に失敗しました",
    }
  }
}
