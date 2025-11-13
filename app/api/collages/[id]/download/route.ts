import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // This endpoint will be called by the frontend to download the collage image
    // The actual image generation happens on the client side or via OG image generation
    // This is a placeholder for future implementation of server-side image download

    return NextResponse.json(
      {
        success: false,
        error: "Image generation is being processed. Please use the preview display.",
      },
      { status: 501 },
    )
  } catch (error) {
    console.error("[GET /api/collages/[id]/download] Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
