import { revalidateTag } from "next/cache"
import { createHmac, timingSafeEqual } from "crypto"

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false
  const hmac = createHmac("sha256", secret)
  const digest = hmac.update(rawBody, "utf8").digest("hex")
  try {
    const a = Buffer.from(digest, "hex")
    const b = Buffer.from(signatureHeader, "hex")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const secret = process.env.MICROCMS_WEBHOOK_SECRET
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, error: "MICROCMS_WEBHOOK_SECRET is not set" }), { status: 500 })
  }

  const raw = await request.text()
  const signature = request.headers.get("x-microcms-signature") || request.headers.get("X-MICROCMS-Signature")
  const isValid = verifySignature(raw, signature, secret)

  if (!isValid) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid signature" }), { status: 401 })
  }

  let payload: any = {}
  try {
    payload = JSON.parse(raw)
  } catch {
    // ignore
  }

  // Tag-based revalidation
  revalidateTag("news")
  const slug = payload?.contents?.slug || payload?.slug
  if (slug) {
    revalidateTag(`news:${slug}`)
  }

  return new Response(JSON.stringify({ ok: true, revalidated: true, slug: slug || null }), { status: 200 })
}
