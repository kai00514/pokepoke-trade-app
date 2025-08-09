import { supabase } from "@/lib/supabase/client"

// 既存の型と整合を取りつつ、利便性の高い関数を追加しています。
export interface CardData {
  id: number
  name: string
  image_url: string
  thumb_url?: string
  type_code?: string
  rarity_code?: string
  category?: string
}

// メモリキャッシュ（クライアント側のみ有効）
const cardCache = new Map<number, CardData>()

/**
 * 与えられたカードID配列のカード情報を一括取得します（重複は内部で除去）
 * - キャッシュを優先
 * - Supabase から不足分のみ取得
 */
export async function getCardsByIds(ids: number[]): Promise<CardData[]> {
  const uniqueIds = Array.from(new Set(ids.filter((n) => Number.isFinite(n) && n > 0)))
  if (uniqueIds.length === 0) return []

  // まずキャッシュヒット分を集める
  const fromCache: CardData[] = []
  const toFetch: number[] = []
  for (const id of uniqueIds) {
    const cached = cardCache.get(id)
    if (cached) {
      fromCache.push(cached)
    } else {
      toFetch.push(id)
    }
  }

  let fetched: CardData[] = []
  if (toFetch.length > 0) {
    const { data, error } = await supabase
      .from("cards")
      .select("id, name, image_url, thumb_url, type_code, rarity_code, category")
      .in("id", toFetch)

    if (error) {
      console.error("Error fetching cards:", error)
    }
    fetched = (data as CardData[]) || []
    // キャッシュへ格納
    for (const c of fetched) {
      cardCache.set(c.id, c)
    }
  }

  // オリジナルの順序（uniqueIds）に並べ替えて返す
  const byId = new Map<number, CardData>()
  for (const c of [...fromCache, ...fetched]) {
    byId.set(c.id, c)
  }
  return uniqueIds.map((id) => byId.get(id)).filter(Boolean) as CardData[]
}

// 既存関数は互換維持のため残します
export async function fetchCardDetailsByIds(cardIds: string[]): Promise<CardData[]> {
  try {
    const numericIds = cardIds.map((id) => Number.parseInt(id, 10)).filter((id) => !isNaN(id))
    if (numericIds.length === 0) return []
    const { data, error } = await supabase
      .from("cards")
      .select("id, name, image_url, thumb_url, type_code, rarity_code, category")
      .in("id", numericIds)
    if (error) {
      console.error("Error fetching card details:", error)
      return []
    }
    // キャッシュにも追加
    for (const c of data || []) {
      cardCache.set(c.id, c as CardData)
    }
    return (data as CardData[]) || []
  } catch (err) {
    console.error("Error in fetchCardDetailsByIds:", err)
    return []
  }
}

export async function fetchCardById(cardId: string | number): Promise<CardData | null> {
  try {
    const numericId = typeof cardId === "string" ? Number.parseInt(cardId, 10) : cardId
    if (isNaN(numericId)) return null
    // キャッシュ優先
    const cached = cardCache.get(numericId)
    if (cached) return cached

    const { data, error } = await supabase
      .from("cards")
      .select("id, name, image_url, thumb_url, type_code, rarity_code, category")
      .eq("id", numericId)
      .single()
    if (error) {
      console.error("Error fetching card:", error)
      return null
    }
    if (data) {
      cardCache.set((data as CardData).id, data as CardData)
    }
    return data as CardData
  } catch (err) {
    console.error("Error in fetchCardById:", err)
    return null
  }
}
