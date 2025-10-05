import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

// Node.js Runtimeで実行（sharpが使える）
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get("url")

    if (!imageUrl) {
      return new NextResponse("Missing url parameter", { status: 400 })
    }

    console.log("Converting WEBP to PNG:", imageUrl)

    // WEBP画像をfetch
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error("Failed to fetch image:", response.status)
      return new NextResponse("Failed to fetch image", { status: 404 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log("Original image size:", buffer.length)

    // WEBP → PNG 変換、315x440にリサイズ
    const pngBuffer = await sharp(buffer)
      .resize(315, 440, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()

    console.log("Converted PNG size:", pngBuffer.length)

    // PNG画像を返す
    return new NextResponse(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Error converting WEBP to PNG:", error)
    return new NextResponse("Error converting image", { status: 500 })
  }
}
