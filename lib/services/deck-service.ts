import { supabase } from "@/lib/supabase/client"

const supabaseClient = supabase

export interface DeckWithCards {
  id: string
  title: string
  description?: string
  user_id: string
  user_display_name?: string
  is_public: boolean
  tags?: string[]
  thumbnail_card_id?: number
  created_at: string
  updated_at: string
  like_count?: number
  favorite_count?: number
  view_count?: number
  comment_count?: number
  deck_cards: Array<{ card_id: number; quantity: number }>
  is_deck_page?: boolean
  deck_name?: string
  thumbnail_image_url?: string
  tier_rank?: number
}

export async function getDeckById(deckId: string): Promise<{ data: DeckWithCards | null; error: string | null }> {
  try {
    const { data: deckData, error: deckError } = await supabaseClient
      .from("decks")
      .select(
        `id, title, description, user_id, is_public, tags, thumbnail_card_id, created_at, updated_at, like_count, favorite_count, view_count, comment_count, deck_cards (card_id, quantity)`,
      )
      .eq("id", deckId)
      .single()
    if (deckData && !deckError) {
      let userDisplayName: string | null = null
      if (deckData.user_id) {
        const { data: userData, error: userError } = await supabaseClient
          .from("users")
          .select("raw_user_meta_data")
          .eq("id", deckData.user_id)
          .single()
        if (!userError && userData?.raw_user_meta_data)
          userDisplayName = (userData.raw_user_meta_data as any).user_name || null
      }
      const result: DeckWithCards = {
        ...deckData,
        user_display_name: userDisplayName,
        is_deck_page: false,
      } as DeckWithCards
      return { data: result, error: null }
    }
    const { data: deckPageData, error: deckPageError } = await supabaseClient
      .from("deck_pages")
      .select(
        `id, title, deck_name, thumbnail_image_url, updated_at, tier_rank, view_count, like_count, comment_count, favorite_count`,
      )
      .eq("id", deckId)
      .single()
    if (deckPageData && !deckPageError) {
      const result: DeckWithCards = {
        id: deckPageData.id,
        title: deckPageData.title || deckPageData.deck_name || "無題のデッキ",
        description: null,
        user_id: "",
        user_display_name: null,
        is_public: true,
        tags: [],
        thumbnail_card_id: null,
        created_at: deckPageData.updated_at,
        updated_at: deckPageData.updated_at,
        like_count: deckPageData.like_count || 0,
        favorite_count: deckPageData.favorite_count || 0,
        view_count: deckPageData.view_count || 0,
        comment_count: deckPageData.comment_count || 0,
        deck_cards: [],
        is_deck_page: true,
        deck_name: deckPageData.deck_name,
        thumbnail_image_url: deckPageData.thumbnail_image_url,
        tier_rank: deckPageData.tier_rank,
      }
      return { data: result, error: null }
    }
    return { data: null, error: "デッキが見つかりません" }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function likeDeck(id: string, isDeckPage = false): Promise<{ error: string | null }> {
  try {
    const { error } = await supabaseClient.rpc(
      isDeckPage ? "increment_deck_page_likes" : "increment_deck_likes",
      isDeckPage ? { deck_page_id_input: id } : { deck_id_input: id },
    )
    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function unlikeDeck(id: string, isDeckPage = false): Promise<{ error: string | null }> {
  try {
    const { error } = await supabaseClient.rpc(
      isDeckPage ? "decrement_deck_page_likes" : "decrement_deck_likes",
      isDeckPage ? { deck_page_id_input: id } : { deck_id_input: id },
    )
    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function favoriteDeck(
  id: string,
  category = "posts",
  isDeckPage: boolean,
): Promise<{ error: string | null }> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) return { error: "ユーザーが認証されていません。" }
    const { error: insertError } = await supabaseClient
      .from("deck_favorites")
      .insert(
        isDeckPage
          ? { user_id: user.id, deck_page_id: id, category: category }
          : { user_id: user.id, deck_id: id, category: category },
      )
    if (insertError) {
      if (insertError.code === "23505") return { error: null }
      return { error: insertError.message }
    }
    const { error: rpcError } = await supabaseClient.rpc(
      isDeckPage ? "increment_deck_page_favorites" : "increment_deck_favorites",
      isDeckPage ? { deck_page_id_input: id } : { deck_id_input: id },
    )
    if (rpcError) return { error: rpcError.message }
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function unfavoriteDeck(id: string, isDeckPage: boolean): Promise<{ error: string | null }> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) return { error: "ユーザーが認証されていません。" }
    const { error: deleteError } = await supabaseClient
      .from("deck_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq(isDeckPage ? "deck_page_id" : "deck_id", id)
    if (deleteError) return { error: deleteError.message }
    const { error: rpcError } = await supabaseClient.rpc(
      isDeckPage ? "decrement_deck_page_favorites" : "decrement_deck_favorites",
      isDeckPage ? { deck_page_id_input: id } : { deck_id_input: id },
    )
    if (rpcError) return { error: rpcError.message }
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function isFavorited(id: string, isDeckPage: boolean): Promise<boolean> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) return false
    const { data, error } = await supabaseClient
      .from("deck_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq(isDeckPage ? "deck_page_id" : "deck_id", id)
      .single()
    if (error && error.code !== "PGRST116") return false
    return !!data
  } catch (err) {
    return false
  }
}

export async function getFavoriteDecks(): Promise<{ data: DeckWithCards[]; error: string | null }> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) return { data: [], error: "ユーザーが認証されていません。" }
    const { data: favoriteEntries, error: fetchError } = await supabaseClient
      .from("deck_favorites")
      .select("deck_id, deck_page_id, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    if (fetchError) return { data: [], error: fetchError.message }
    const deckIds = favoriteEntries.map((entry) => entry.deck_id).filter(Boolean) as string[]
    const deckPageIds = favoriteEntries.map((entry) => entry.deck_page_id).filter(Boolean) as string[]
    let decksData: any[] = []
    let deckPagesData: any[] = []
    if (deckIds.length > 0) {
      const { data, error } = await supabaseClient
        .from("decks")
        .select(
          `id, title, description, user_id, is_public, tags, thumbnail_card_id, created_at, updated_at, like_count, favorite_count, view_count, comment_count, deck_cards (card_id, quantity), thumbnail_image:cards!thumbnail_card_id (id, name, image_url, thumb_url)`,
        )
        .in("id", deckIds)
      if (error) console.error("🌟 Error fetching favorited decks:", error)
      else decksData = data
    }
    if (deckPageIds.length > 0) {
      const { data, error } = await supabaseClient
        .from("deck_pages")
        .select(
          `id, title, deck_name, thumbnail_image_url, updated_at, tier_rank, view_count, like_count, comment_count, favorite_count`,
        )
        .in("id", deckPageIds)
      if (error) console.error("🌟 Error fetching favorited deck pages:", error)
      else deckPagesData = data
    }
    const allDecksMap = new Map<string, any>()
    decksData.forEach((d) =>
      allDecksMap.set(d.id, { ...d, is_deck_page: false, deck_name: null, thumbnail_image_url: null, tier_rank: null }),
    )
    deckPagesData.forEach((dp) =>
      allDecksMap.set(dp.id, {
        id: dp.id,
        title: dp.title || dp.deck_name || "無題のデッキ",
        description: null,
        user_id: null,
        is_public: true,
        tags: [],
        thumbnail_card_id: null,
        created_at: dp.updated_at,
        updated_at: dp.updated_at,
        like_count: dp.like_count || 0,
        favorite_count: dp.favorite_count || 0,
        view_count: dp.view_count || 0,
        comment_count: dp.comment_count || 0,
        deck_cards: [],
        thumbnail_image: dp.thumbnail_image_url
          ? {
              id: 0,
              name: dp.deck_name || dp.title || "無題のデッキ",
              image_url: dp.thumbnail_image_url,
              thumb_url: dp.thumbnail_image_url,
            }
          : null,
        is_deck_page: true,
        deck_name: dp.deck_name,
        thumbnail_image_url: dp.thumbnail_image_url,
        tier_rank: dp.tier_rank,
      }),
    )
    const formattedDecks: DeckWithCards[] = []
    const userIdsToFetch: string[] = []
    for (const entry of favoriteEntries) {
      const deckId = entry.deck_id || entry.deck_page_id
      if (allDecksMap.has(deckId)) {
        const deck = allDecksMap.get(deckId)
        formattedDecks.push({ ...deck, source_tab: "お気に入り", category: entry.category })
        if (deck.user_id && !userIdsToFetch.includes(deck.user_id)) userIdsToFetch.push(deck.user_id)
      }
    }
    const userDisplayNames: { [key: string]: string } = {}
    if (userIdsToFetch.length > 0) {
      const { data: usersData, error: usersError } = await supabaseClient
        .from("users")
        .select("id, raw_user_meta_data")
        .in("id", userIdsToFetch)
      if (usersError) console.error("🌟 Error fetching user display names:", usersError)
      else
        usersData.forEach((u) => {
          if (u.raw_user_meta_data) userDisplayNames[u.id] = (u.raw_user_meta_data as any).user_name || ""
        })
    }
    const finalFormattedDecks = formattedDecks.map((deck) => ({
      ...deck,
      user_display_name: deck.user_id ? userDisplayNames[deck.user_id] : null,
    }))
    return { data: finalFormattedDecks, error: null }
  } catch (err) {
    return { data: [], error: err instanceof Error ? err.message : "Unknown error" }
  }
}
