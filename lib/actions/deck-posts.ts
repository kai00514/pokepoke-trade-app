"use server"

import { createClient } from "@supabase/supabase-js"

import { fetchCardDetailsByIds, type CardData } from "@/lib/card-api" // CardData型もインポート

// Supabaseクライアントを作成
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// deck_pagesテーブルからデッキリストを取得する関数

/**
 * デッキの一覧を取得する（既存関数の確認・追加）
 */
export async function getDecksList(options?: {
  limit?: number
  offset?: number
  userId?: string
  isPublic?: boolean
}): Promise<{ success: boolean; data?: any[]; count?: number; error?: string }> {
  try {
    // 既に作成されたsupabaseクライアントを使用
    const limit = options?.limit || 20
    const offset = options?.offset || 0

    // 基本クエリを構築 - cardsテーブルとJOINしてサムネイル画像を取得
    let query = supabase.from("decks").select(
      `
        *,
        deck_cards (
          card_id,
          quantity
        ),
        thumbnail_card:cards!thumbnail_card_id (
          id,
          name,
          name_multilingual,
          image_url,
          image_url_multilingual,
          thumb_url
        )
      `,
      { count: "exact" },
    )

    // フィルタリング
    if (options?.userId) {
      query = query.eq("user_id", options.userId)
    }

    if (options?.isPublic !== undefined) {
      query = query.eq("is_public", options.isPublic)
    }

    // ソート、リミット、オフセットを適用
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw new Error(`デッキの取得に失敗しました: ${error.message}`)

    // データを整形してサムネイル情報を含める
    const formattedData = data?.map((deck) => ({
      ...deck,
      thumbnail_image: deck.thumbnail_card
        ? {
            id: deck.thumbnail_card.id,
            name: deck.thumbnail_card.name,
            name_multilingual: deck.thumbnail_card.name_multilingual,
            image_url: deck.thumbnail_card.image_url,
            image_url_multilingual: deck.thumbnail_card.image_url_multilingual,
            thumb_url: deck.thumbnail_card.thumb_url,
          }
        : null,
    }))

    return { success: true, data: formattedData, count }
  } catch (error) {
    console.error("デッキ一覧取得エラー:", error)
    return { success: false, error: error instanceof Error ? error.message : "デッキの取得に失敗しました" }
  }
}

/**
 * deck_pagesテーブルからデッキリストを取得する
 */
export async function getDeckPagesList(options?: {
  sortBy?: "latest" | "popular" | "tier"
  category?: "tier" | "newpack" | "featured"
  limit?: number
  page?: number
}): Promise<{ success: boolean; data?: any[]; total?: number; hasMore?: boolean; error?: string }> {
  try {
    const { sortBy = "latest", category, limit = 20, page = 1 } = options || {}
    const offset = (page - 1) * limit

    let query = supabase
      .from("deck_pages")
      .select(
        `
        id,
        title,
        deck_name,
        thumbnail_image_url,
        tier_rank,
        view_count,
        like_count,
        comment_count,
        updated_at,
        is_published,
        category,
        deck_cards
      `,
        { count: "exact" },
      )
      .eq("is_published", true)

    // カテゴリでフィルタリング
    if (category) {
      query = query.eq("category", category)
    }

    query = query.range(offset, offset + limit - 1)

    // ソート条件
    switch (sortBy) {
      case "latest":
        query = query.order("updated_at", { ascending: false })
        break
      case "popular":
        query = query.order("view_count", { ascending: false })
        break
      case "tier":
        query = query.order("tier_rank", { ascending: true }).order("view_count", { ascending: false })
        break
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Error fetching deck pages:", error)
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        hasMore: false,
      }
    }

    // Step 1: deck_cardsからカードIDを抽出してカード詳細を取得
    const enrichedData = await Promise.all(
      (data || []).map(async (deckPage) => {
        try {
          let cardsData: any[] = []

          // deck_cardsの処理
          if (deckPage.deck_cards) {
            if (typeof deckPage.deck_cards === "string") {
              try {
                cardsData = JSON.parse(deckPage.deck_cards)
              } catch (parseError) {
                console.error("Failed to parse deck_cards as JSON:", parseError)
                cardsData = []
              }
            } else if (Array.isArray(deckPage.deck_cards)) {
              cardsData = deckPage.deck_cards
            } else if (typeof deckPage.deck_cards === "object") {
              cardsData = Object.values(deckPage.deck_cards).filter((item) => item && typeof item === "object")
            }
          }

          // カードIDを抽出
          const cardIds = cardsData.map((card: any) => card.card_id?.toString()).filter(Boolean)

          // カード詳細を取得
          let cardDetails: CardData[] = []
          if (cardIds.length > 0) {
            try {
              cardDetails = await fetchCardDetailsByIds(cardIds)
            } catch (fetchError) {
              console.error("Failed to fetch card details:", fetchError)
              cardDetails = []
            }
          }

          // カード詳細をマップに変換
          const cardDetailsMap = new Map<number, CardData>()
          cardDetails.forEach((detail) => {
            cardDetailsMap.set(detail.id, detail)
          })

          // カードデータを詳細情報で拡張
          const enrichedCards = cardsData.map((card: any) => {
            const detail = cardDetailsMap.get(card.card_id)
            return {
              card_id: card.card_id,
              quantity: card.card_count || card.quantity || 1,
              name: detail?.name || "不明なカード",
              image_url: detail?.image_url || "/placeholder.svg?height=100&width=70",
              thumb_url: detail?.thumb_url || detail?.image_url || "/placeholder.svg?height=100&width=70",
              pack_name: card.pack_name || "不明なパック",
              display_order: card.display_order || 0,
            }
          })

          return {
            ...deckPage,
            deck_cards: enrichedCards,
          }
        } catch (error) {
          console.error(`Error processing deck page ${deckPage.id}:`, error)
          return {
            ...deckPage,
            deck_cards: [],
          }
        }
      }),
    )

    const total = count || 0
    const hasMore = offset + limit < total

    return {
      success: true,
      data: enrichedData,
      total,
      hasMore,
      error: undefined,
    }
  } catch (error) {
    console.error("Error in getDeckPagesList:", error)
    return {
      success: false,
      error: "デッキの取得に失敗しました",
      data: [],
      total: 0,
      hasMore: false,
    }
  }
}

/**
 * 個別のデッキページを取得する関数
 */
export async function getDeckPageById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.from("deck_pages").select("*").eq("id", id).eq("is_published", true).single()

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "デッキが見つかりません", data: null }
      }
      return { success: false, error: error.message, data: null }
    }

    // デバッグ: 取得したデータの詳細を確認
    console.log("Raw deck_pages data:", data)
    console.log("deck_cards type:", typeof data.deck_cards)
    console.log("deck_cards value:", data.deck_cards)
    console.log("deck_cards is array:", Array.isArray(data.deck_cards))

    // ビュー数を増加（非同期で実行、エラーは無視）
    supabase
      .from("deck_pages")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          console.warn("Failed to update view count:", error)
        }
      })

    // deck_cardsの処理
    let cardsData: any[] = []

    if (data.deck_cards) {
      // deck_cardsが文字列の場合はJSONパースを試行
      if (typeof data.deck_cards === "string") {
        try {
          cardsData = JSON.parse(data.deck_cards)
          console.log("Parsed deck_cards from string:", cardsData)
        } catch (parseError) {
          console.error("Failed to parse deck_cards as JSON:", parseError)
          cardsData = []
        }
      }
      // deck_cardsが既に配列の場合
      else if (Array.isArray(data.deck_cards)) {
        cardsData = data.deck_cards
        console.log("deck_cards is already an array:", cardsData)
      }
      // その他のオブジェクト型の場合
      else if (typeof data.deck_cards === "object") {
        console.log("deck_cards is an object, attempting to convert:", data.deck_cards)
        // オブジェクトを配列に変換を試行
        cardsData = Object.values(data.deck_cards).filter((item) => item && typeof item === "object")
      }
    }

    console.log("Final processed cardsData:", cardsData)
    console.log("cardsData length:", cardsData.length)

    // cardsDataが存在し、配列である場合、カード詳細情報を取得して結合
    if (Array.isArray(cardsData) && cardsData.length > 0) {
      const cardIds = cardsData.map((card: any) => card.card_id?.toString()).filter(Boolean)
      console.log("Extracting card IDs:", cardIds)

      if (cardIds.length > 0) {
        console.log("Fetching card details for IDs:", cardIds)
        const cardDetails = await fetchCardDetailsByIds(cardIds)
        console.log("Fetched card details:", cardDetails)

        const cardDetailsMap = new Map<number, CardData>()
        cardDetails.forEach((detail) => {
          cardDetailsMap.set(detail.id, detail)
        })

        data.cards_data = cardsData.map((card: any) => {
          const detail = cardDetailsMap.get(card.card_id)
          const enrichedCard = {
            card_id: card.card_id,
            quantity: card.card_count || 1, // card_countをquantityにマッピング
            name: detail?.name || "不明なカード",
            name_multilingual: detail?.name_multilingual,
            image_url: detail?.image_url || "/placeholder.svg?height=100&width=70",
            image_url_multilingual: detail?.image_url_multilingual,
            thumb_url: detail?.thumb_url || detail?.image_url || "/placeholder.svg?height=100&width=70",
            pack_name: card.pack_name || "不明なパック",
            display_order: card.display_order || 0,
          }
          console.log(`Enriched card ${enrichedCard.card_id}:`, enrichedCard)
          return enrichedCard
        })
        console.log("Final enriched cards_data:", data.cards_data)
      } else {
        console.log("No valid card IDs found in cardsData")
        data.cards_data = []
      }
    } else {
      data.cards_data = []
      console.log("deck_cards is empty, null, or not an array after processing.")
    }

    return { success: true, data, error: undefined }
  } catch (error) {
    console.error("Error in getDeckPageById:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "デッキの取得に失敗しました",
      data: null,
    }
  }
}

/**
 * デッキを作成する
 */
export async function createDeck(input: CreateDeckInput): Promise<{ success: boolean; data?: Deck; error?: string }> {
  try {
    console.log("[createDeck] Starting deck creation with input:", {
      title: input.title,
      user_id: input.user_id,
      guestName: input.guestName,
      is_authenticated: input.is_authenticated,
      card_count: input.deck_cards.length,
      total_cards: input.deck_cards.reduce((sum, card) => sum + card.quantity, 0),
      thumbnail_card_id: input.thumbnail_card_id,
    })

    // カード枚数の検証
    const totalCards = input.deck_cards.reduce((sum, card) => sum + card.quantity, 0)
    if (totalCards !== 20) {
      throw new Error(`デッキはちょうど20枚である必要があります。(現在: ${totalCards}枚)`)
    }

    // 各カードの枚数制限チェック
    const invalidCards = input.deck_cards.filter((card) => card.quantity < 1 || card.quantity > 2)
    if (invalidCards.length > 0) {
      throw new Error("同じカードは1〜2枚までです。")
    }

    // 自動翻訳: タイトルと説明を全言語に翻訳
    const sourceLang = 'ja';
    const targetLangs = ['en', 'zh-tw', 'ko', 'fr', 'es', 'de'];
    
    const title_multilingual: Record<string, string> = { ja: input.title };
    const description_multilingual: Record<string, string> | null = input.description 
      ? { ja: input.description } 
      : null;

    console.log("[createDeck] 🌐 Starting auto-translation for", targetLangs.length, "languages...")

    // タイトルと説明を翻訳
    for (const targetLang of targetLangs) {
      try {
        const { translateTextWithGlossary } = await import('@/lib/google-translate');
        
        title_multilingual[targetLang] = await translateTextWithGlossary(
          input.title,
          sourceLang,
          targetLang,
          true
        );
        
        // 説明があれば翻訳
        if (input.description && description_multilingual) {
          description_multilingual[targetLang] = await translateTextWithGlossary(
            input.description,
            sourceLang,
            targetLang,
            true
          );
        }
        
        console.log(`[createDeck] ✅ Translated to ${targetLang}`);
        
        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, input.description ? 200 : 100));
      } catch (error) {
        console.error(`[createDeck] ❌ Translation failed for ${targetLang}:`, error);
        // エラー時は元のテキストを使用
        title_multilingual[targetLang] = input.title;
        if (input.description && description_multilingual) {
          description_multilingual[targetLang] = input.description;
        }
      }
    }

    console.log("[createDeck] 🎉 Auto-translation completed!")

    // 1. decksテーブルにデッキを作成
    const insertData: any = {
      title: input.title,
      title_multilingual,
      description: input.description || null,
      description_multilingual,
      is_public: input.is_public,
      tags: input.tags || [],
      thumbnail_card_id: input.thumbnail_card_id || null,
    }

    // ユーザー情報の設定
    if (input.is_authenticated && input.user_id) {
      insertData.user_id = input.user_id
      insertData.guest_name = null
    } else {
      insertData.user_id = null
      insertData.guest_name = "ゲスト" // ゲスト名を固定
    }

    console.log("[createDeck] Insert data:", {
      ...insertData,
      title_multilingual: `{${Object.keys(title_multilingual).length} languages}`,
      description_multilingual: description_multilingual ? `{${Object.keys(description_multilingual).length} languages}` : null,
    })

    const { data: deckData, error: deckError } = await supabase.from("decks").insert(insertData).select().single()

    if (deckError) throw new Error(`デッキの作成に失敗しました: ${deckError.message}`)
    if (!deckData) throw new Error("デッキの作成に失敗しました: データが返されませんでした")

    console.log("[createDeck] Deck created successfully:", deckData.id)

    // 2. デッキカードを関連付け
    if (input.deck_cards.length > 0) {
      const deckCardsData = input.deck_cards.map((card) => ({
        deck_id: deckData.id,
        card_id: card.card_id,
        quantity: card.quantity,
      }))

      const { error: cardsError } = await supabase.from("deck_cards").insert(deckCardsData)

      if (cardsError) {
        // デッキカードの挿入に失敗した場合、作成したデッキを削除
        await supabase.from("decks").delete().eq("id", deckData.id)
        throw new Error(`デッキカードの関連付けに失敗しました: ${cardsError.message}`)
      }
    }

    return { success: true, data: deckData }
  } catch (error) {
    console.error("デッキ作成エラー:", error)
    return { success: false, error: error instanceof Error ? error.message : "デッキの作成に失敗しました" }
  }
}

// 型定義も更新（guestNameを削除）
export type CreateDeckInput = {
  title: string
  user_id?: string | null
  guestName?: string // 内部的に「ゲスト」に固定されるため、オプショナルのまま
  description?: string
  is_public: boolean
  tags?: string[]
  deck_cards: DeckCard[]
  thumbnail_card_id?: number
  is_authenticated: boolean
}

export type Deck = {
  id: string
  user_id: string | null
  guest_name: string | null
  title: string
  description?: string
  is_public: boolean
  tags?: string[]
  thumbnail_card_id?: number
  created_at: string
  updated_at: string
}

export type DeckCard = {
  card_id: number
  quantity: number
  name?: string
  image_url?: string
}
