import { revalidatePath } from "next/cache"

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  })
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || ""
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, error: "REVALIDATE_SECRET not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
  const expected = `Bearer ${secret}`
  if (auth !== expected) {
    return unauthorized()
  }

  let id: string | null = null
  try {
    const body = await req.json().catch(() => ({}))
    if (body && typeof body.id === "string" && body.id.length > 0) {
      id = body.id
    }
  } catch {
    // ignore bad JSON
  }

  // Revalidate dashboard and full list first
  revalidatePath("/info")
  revalidatePath("/info/news")

  if (id) {
    revalidatePath("/info/[id]")
    revalidatePath(`/info/${id}`)
  }

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
