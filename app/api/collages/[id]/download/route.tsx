import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await createServerClient()

    const { data: collage, error } = await supabase
      .from("user_collages")
      .select("collage_image_url, title1")
      .eq("id", id)
      .single()

    if (error || !collage) {
      return NextResponse.json({ success: false, error: "Collage not found" }, { status: 404 })
    }

    // Storageの画像が存在する場合はそれを配信
    if (collage.collage_image_url) {
      const imageResponse = await fetch(collage.collage_image_url)

      if (imageResponse.ok) {
        const imageBuffer = await imageResponse.arrayBuffer()

        return new Response(imageBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="collage-${id}.png"`,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        })
      }
    }

    // Storageに画像が無い場合はエラー
    return NextResponse.json({ success: false, error: "Image not available" }, { status: 404 })

    // ここに元のコードを残すか、削除するか判断する
    // const allCardIds = [...(collage.card_ids_1 || []), ...(collage.card_ids_2 || [])]

    // const { data: cards } = await supabase.from("cards").select("id, name, image_url").in("id", allCardIds)

    // const cardMap = new Map(cards?.map((c) => [c.id, c]) || [])

    // async function convertImageToDataUrl(imageUrl: string): Promise<string> {
    //   try {
    //     const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) })
    //     const arrayBuffer = await response.arrayBuffer()
    //     const buffer = Buffer.from(arrayBuffer)
    //     const base64 = buffer.toString("base64")
    //     const mimeType = response.headers.get("content-type") || "image/jpeg"
    //     return `data:${mimeType};base64,${base64}`
    //   } catch {
    //     return `/placeholder.svg?width=100&height=100`
    //   }
    // }

    // const cards1 = await Promise.all(
    //   (collage.card_ids_1 || []).map(async (id: number) => {
    //     const card = cardMap.get(id)
    //     return {
    //       id,
    //       name: card?.name || "不明",
    //       imageUrl: card?.image_url
    //         ? await convertImageToDataUrl(card.image_url)
    //         : "/placeholder.svg?width=100&height=100",
    //     }
    //   }),
    // )

    // const cards2 = await Promise.all(
    //   (collage.card_ids_2 || []).map(async (id: number) => {
    //     const card = cardMap.get(id)
    //     return {
    //       id,
    //       name: card?.name || "不明",
    //       imageUrl: card?.image_url
    //         ? await convertImageToDataUrl(card.image_url)
    //         : "/placeholder.svg?width=100&height=100",
    //     }
    //   }),
    // )

    // const bgWidth = 1536
    // const bgHeight = 1024
    // const titleHeight = 80
    // const gridWidth = 1416 // 1536 - 左右パディング60px×2

    // const layout1 = calculateGridLayout(cards1.length)
    // const layout2 = calculateGridLayout(cards2.length)
    // const zones = calculateUniformSpacing(cards1.length, cards2.length)

    // const bgResponse = await fetch(
    //   new URL("/coragu_backimage.png", process.env.NEXT_PUBLIC_SITE_URL || "https://www.pokelnk.com").href,
    // )
    // const bgArrayBuffer = await bgResponse.arrayBuffer()
    // const bgBase64 = Buffer.from(bgArrayBuffer).toString("base64")
    // const bgDataUrl = `data:image/png;base64,${bgBase64}`

    // const imageResponse = new ImageResponse(
    //   <div
    //     style={{
    //       width: bgWidth,
    //       height: bgHeight,
    //       display: "flex",
    //       position: "relative",
    //     }}
    //   >
    //     <img
    //       src={bgDataUrl || "/placeholder.svg"}
    //       alt="background"
    //       style={{ width: bgWidth, height: bgHeight, position: "absolute" }}
    //     />

    //     <div
    //       style={{
    //         position: "absolute",
    //         top: zones.zone1Y + 25,
    //         left: 60,
    //         color: "#FFFFFF",
    //         fontSize: 28,
    //         fontWeight: "bold",
    //       }}
    //     >
    //       {collage.title1}
    //     </div>

    //     <div
    //       style={{
    //         position: "absolute",
    //         top: zones.zone2Y,
    //         left: 60,
    //         display: "flex",
    //         flexWrap: "wrap",
    //         width: gridWidth,
    //         gap: layout1.spacing,
    //       }}
    //     >
    //       {cards1.map((card, idx) => (
    //         <img
    //           key={idx}
    //           src={card.imageUrl || "/placeholder.svg"}
    //           alt={card.name}
    //           style={{ width: layout1.cardSize, height: layout1.cardSize, objectFit: "cover", borderRadius: "4px" }}
    //         />
    //       ))}
    //     </div>

    //     <div
    //       style={{
    //         position: "absolute",
    //         top: zones.zone3Y + 25,
    //         left: 60,
    //         color: "#FFFFFF",
    //         fontSize: 28,
    //         fontWeight: "bold",
    //       }}
    //     >
    //       {collage.title2}
    //     </div>

    //     <div
    //       style={{
    //         position: "absolute",
    //         top: zones.zone4Y,
    //         left: 60,
    //         display: "flex",
    //         flexWrap: "wrap",
    //         width: gridWidth,
    //         gap: layout2.spacing,
    //       }}
    //     >
    //       {cards2.map((card, idx) => (
    //         <img
    //           key={idx}
    //           src={card.imageUrl || "/placeholder.svg"}
    //           alt={card.name}
    //           style={{ width: layout2.cardSize, height: layout2.cardSize, objectFit: "cover", borderRadius: "4px" }}
    //         />
    //       ))}
    //     </div>
    //   </div>,
    //   {
    //     width: bgWidth,
    //     height: bgHeight,
    //   },
    // )

    // const imageBuffer = await imageResponse.arrayBuffer()

    // return new Response(imageBuffer, {
    //   headers: {
    //     "Content-Type": "image/png",
    //     "Content-Disposition": `attachment; filename="collage-${id}.png"`,
    //     "Cache-Control": "public, max-age=31536000, immutable",
    //   },
    // })
  } catch (error) {
    console.error("[GET /api/collages/[id]/download] Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
