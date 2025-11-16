import { ImageResponse } from "next/og"
import { type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { CollageLayout } from "@/components/collage/collage-layout"

export const runtime = "edge"

/**
 * 画像をData URL（Base64エンコード）に変換
 */
async function convertImageToDataUrl(imageUrl: string | null, label = "image"): Promise<string | null> {
  if (!imageUrl) return null

  let absoluteUrl = imageUrl
  if (imageUrl.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com"
    absoluteUrl = `${baseUrl}${imageUrl}`
  }

  try {
    console.log(`[${label}] Fetching image:`, absoluteUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(absoluteUrl, { signal: controller.signal }).finally(() => clearTimeout(timeoutId))

    if (!response.ok) {
      console.error(`[${label}] Failed to fetch image:`, response.status)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const contentType = response.headers.get("content-type") || "image/png"

    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error(`[${label}] Error converting image:`, error)
    return null
  }
}

/**
 * コラージュIDから画像を生成
 * GET /api/collages/image?id={collageId}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const collageId = searchParams.get("id")
    const gapParam = searchParams.get("gap")
    const gap = gapParam ? parseInt(gapParam, 10) : 0

    if (!collageId) {
      return new Response("Missing collage ID", { status: 400 })
    }

    const supabase = await createServerClient()

    // コラージュデータを取得
    const { data: collage, error } = await supabase
      .from("user_collages")
      .select("id, title1, title2, card_ids_1, card_ids_2")
      .eq("id", collageId)
      .single()

    if (error || !collage) {
      console.error("Error fetching collage:", error)
      return new Response("Collage not found", { status: 404 })
    }

    // カード情報を取得
    const allCardIds = [...(collage.card_ids_1 || []), ...(collage.card_ids_2 || [])]

    if (allCardIds.length === 0) {
      return new Response("No cards found", { status: 400 })
    }

    const { data: cardsData, error: cardsError } = await supabase
      .from("cards")
      .select("id, name, image_url")
      .in("id", allCardIds)
      .eq("is_visible", true)

    if (cardsError || !cardsData) {
      console.error("Error fetching cards:", cardsError)
      return new Response("Failed to fetch card data", { status: 500 })
    }

    // カードマップを作成
    const cardsMap = new Map()
    cardsData.forEach((card: any) => {
      cardsMap.set(card.id, card)
    })

    // カード画像をData URLに変換（並列処理）
    const cards1ImageUrls = collage.card_ids_1 || []
    const cards2ImageUrls = collage.card_ids_2 || []

    const cards1DataUrls = await Promise.all(
      cards1ImageUrls.map(async (id: number, index: number) => {
        const card = cardsMap.get(id)
        const imageUrl = card?.image_url || null
        return (await convertImageToDataUrl(imageUrl, `card1-${index}`)) || ""
      }),
    )

    const cards2DataUrls = await Promise.all(
      cards2ImageUrls.map(async (id: number, index: number) => {
        const card = cardsMap.get(id)
        const imageUrl = card?.image_url || null
        return (await convertImageToDataUrl(imageUrl, `card2-${index}`)) || ""
      }),
    )

    // 空のData URLを除外
    const validCards1 = cards1DataUrls.filter((url) => url !== "")
    const validCards2 = cards2DataUrls.filter((url) => url !== "")

    console.log(`[GET /api/collages/image] Generating image for collage ${collageId}`)
    console.log(`[GET /api/collages/image] Cards1: ${validCards1.length}, Cards2: ${validCards2.length}`)

    // ImageResponseで画像生成
    return new ImageResponse(
      <CollageLayout
        title1={collage.title1}
        title2={collage.title2}
        cards1DataUrls={validCards1}
        cards2DataUrls={validCards2}
        gap={gap}
      />,
      {
        width: 1536,
        height: 1024,
      },
    )
  } catch (error) {
    console.error("[GET /api/collages/image] Error:", error)
    return new Response("Internal server error", { status: 500 })
  }
}
