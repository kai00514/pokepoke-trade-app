import { revalidateTag } from "next/cache"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const secret = process.env.MICROCMS_WEBHOOK_SECRET
    if (!secret) {
      return new Response("MICROCMS_WEBHOOK_SECRET not set", { status: 500 })
    }

    const signature = request.headers.get("X-MICROCMS-Signature") || request.headers.get("x-microcms-signature")
    if (!signature) {
      return new Response("Missing signature", { status: 400 })
    }

    const bodyText = await request.text()

    const hmac = crypto.createHmac("sha256", secret)
    const digest = hmac.update(bodyText).digest("hex")

    const valid =
      digest.length === signature.length && crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))

    if (!valid) {
      return new Response("Invalid signature", { status: 401 })
    }

    // Signature valid -> parse JSON
    const payload = JSON.parse(bodyText || "{}")
    const slug = payload?.slug ?? payload?.contents?.slug ?? payload?.content?.slug ?? null

    revalidateTag("news")
    if (slug) {
      revalidateTag(`news:${slug}`)
    }

    return Response.json({ revalidated: true, slug: slug || null })
  } catch (e) {
    console.error(e)
    return new Response("Error processing webhook", { status: 500 })
  }
}
