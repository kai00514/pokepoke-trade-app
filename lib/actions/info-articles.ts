"use server"

import "server-only"
import { createServerClient } from "@/lib/supabase/server"

/**
 * InfoArticle list/detail types (lightweight).
 */
export type InfoArticle = {
  id: string
  title: string
  excerpt?: string | null
  thumbnail_image_url?: string | null
  tags?: string[] | null
  category?: string | null
  published_at: string
  pinned?: boolean | null
  priority?: number | null
}

export type InfoArticleMeta = InfoArticle & {
  slug?: string | null
  updated_at?: string | null
}

/**
 * Block types (discriminated union).
 * Includes extended types used by the article renderer.
 */
type BlockBase<TType extends string, TData> = {
  type: TType
  display_order: number
  data: TData
}

export type HeadingBlock = BlockBase<
  "heading",
  {
    level: 1 | 2 | 3
    text: string
    anchorId?: string
  }
>

export type ParagraphBlock = BlockBase<
  "paragraph",
  {
    text: string
  }
>

export type ImageBlock = BlockBase<
  "image",
  {
    url: string
    alt?: string
    caption?: string
    aspect?: string
  }
>

export type TocBlock = BlockBase<
  "toc",
  {
    fromHeadings?: boolean
  }
>

export type ListBlock = BlockBase<
  "list",
  {
    style: "bulleted" | "numbered"
    items: string[]
  }
>

export type TableBlock = BlockBase<
  "table",
  {
    headers?: string[]
    rows: string[][]
  }
>

export type RelatedLinksBlock = BlockBase<
  "related-links",
  {
    items: { href: string; label: string }[]
  }
>

export type DividerBlock = BlockBase<"divider", Record<string, never>>

export type CalloutBlock = BlockBase<
  "callout",
  {
    tone?: "info" | "warning" | "success"
    text: string
    title?: string
  }
>

export type EvaluationBlock = BlockBase<
  "evaluation",
  {
    tier_rank?: string | number
    max_damage?: string | number
    build_difficulty?: string
    stat_accessibility?: string
    stat_stability?: string
    eval_value?: number
    eval_count?: number
  }
>

export type CardsTableBlock = BlockBase<
  "cards-table",
  {
    items: { id?: string; card_id: string | number; explanation?: string; quantity?: number; name?: string }[]
    headers?: { id?: string; card?: string; explanation?: string; quantity?: string }
  }
>

/**
 * New: pickup info block (red-accent card with starred links/text list)
 */
export type PickupBlock = BlockBase<
  "pickup",
  {
    title?: string
    items: { label: string; href?: string }[]
  }
>

/**
 * New: button block (blue outlined CTA)
 */
export type ButtonBlock = BlockBase<
  "button",
  {
    label: string
    href: string
  }
>

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | TocBlock
  | ListBlock
  | TableBlock
  | RelatedLinksBlock
  | DividerBlock
  | CalloutBlock
  | EvaluationBlock
  | CardsTableBlock
  | PickupBlock
  | ButtonBlock

type RawDbBlock = {
  display_order: number | null
  type: string | null
  data: unknown
}

async function supabaseServer() {
  return await createServerClient()
}

function isHttpishUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length === 0) return false
  if (url.startsWith("/")) return true
  return url.startsWith("https://") || url.startsWith("http://")
}

function isHttpsUrl(url: unknown): url is string {
  return typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))
}

function isStringTable(x: unknown): x is string[][] {
  return Array.isArray(x) && x.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"))
}

/**
 * Validate and normalize blocks (server-side).
 * - Only returns supported/safe blocks.
 * - Skips invalid payloads with console.warn.
 * - Defaults:
 *   - toc.fromHeadings: true
 *   - callout.tone: "info"
 *   - list items: trimmed, empties removed
 *   - cards-table.quantity: 1
 */
function validateBlocks(rawBlocks: RawDbBlock[]): Block[] {
  const safe: Block[] = []

  for (const rb of rawBlocks) {
    const order = Number(rb.display_order ?? 0)
    const t = typeof rb.type === "string" ? rb.type : ""

    try {
      switch (t) {
        case "heading": {
          const d = rb.data as any
          const level = d?.level
          const text = typeof d?.text === "string" ? d.text.trim() : ""
          if ((level === 1 || level === 2 || level === 3) && text) {
            safe.push({
              type: "heading",
              display_order: order,
              data: {
                level,
                text,
                anchorId: typeof d?.anchorId === "string" && d.anchorId.trim() ? d.anchorId : undefined,
              },
            })
          } else {
            console.warn("[info-articles] Skip invalid heading block", { order, d })
          }
          break
        }

        case "paragraph": {
          const d = rb.data as any
          const text = typeof d?.text === "string" ? d.text : ""
          if (text.trim()) {
            safe.push({ type: "paragraph", display_order: order, data: { text } })
          } else {
            console.warn("[info-articles] Skip invalid paragraph block", { order, d })
          }
          break
        }

        case "image": {
          const d = rb.data as any
          const url = d?.url
          if (isHttpsUrl(url)) {
            safe.push({
              type: "image",
              display_order: order,
              data: {
                url,
                alt: typeof d?.alt === "string" ? d.alt : undefined,
                caption: typeof d?.caption === "string" ? d.caption : undefined,
                aspect: typeof d?.aspect === "string" ? d.aspect : undefined,
              },
            })
          } else {
            console.warn("[info-articles] Skip invalid image block", { order, url })
          }
          break
        }

        case "list": {
          const d = rb.data as any
          const style = d?.style === "numbered" ? "numbered" : d?.style === "bulleted" ? "bulleted" : null
          const items = Array.isArray(d?.items) ? d.items : []
          const strItems = items
            .map((it: unknown) => (typeof it === "string" ? it.trim() : ""))
            .filter((s: string) => s.length > 0)
          if (style && strItems.length > 0) {
            safe.push({ type: "list", display_order: order, data: { style, items: strItems } })
          } else {
            console.warn("[info-articles] Skip invalid list block", { order, d })
          }
          break
        }

        case "table": {
          const d = rb.data as any
          const headers = Array.isArray(d?.headers) ? d.headers.map((h: unknown) => String(h ?? "")) : undefined
          const rows = isStringTable(d?.rows)
            ? d.rows
            : Array.isArray(d?.rows)
              ? d.rows
                  .map((r: unknown[]) => (Array.isArray(r) ? r.map((c) => String(c ?? "")) : []))
                  .filter((r) => r.length > 0)
              : []
          if ((headers && headers.length > 0) || rows.length > 0) {
            safe.push({ type: "table", display_order: order, data: { headers, rows } })
          } else {
            console.warn("[info-articles] Skip invalid/empty table block", { order, d })
          }
          break
        }

        case "toc": {
          const d = rb.data as any
          const fromHeadings = typeof d?.fromHeadings === "boolean" ? d.fromHeadings : true
          safe.push({ type: "toc", display_order: order, data: { fromHeadings } })
          break
        }

        case "related-links": {
          const d = rb.data as any
          const itemsRaw = Array.isArray(d?.items) ? d.items : []
          const items = itemsRaw
            .filter((it: any) => it && isHttpishUrl(it.href) && typeof it.label === "string" && it.label.trim())
            .map((it: any) => ({ href: it.href, label: it.label.trim() }))
          if (items.length > 0) {
            safe.push({ type: "related-links", display_order: order, data: { items } })
          } else {
            console.warn("[info-articles] Skip invalid related-links block", { order, d })
          }
          break
        }

        case "divider": {
          safe.push({ type: "divider", display_order: order, data: {} })
          break
        }

        case "callout": {
          const d = rb.data as any
          // textフィールドとbodyフィールドの両方をチェック
          const text = typeof d?.text === "string" ? d.text.trim() : typeof d?.body === "string" ? d.body.trim() : ""
          const tone = d?.tone === "warning" ? "warning" : d?.tone === "success" ? "success" : "info"
          const title = typeof d?.title === "string" ? d.title.trim() : undefined

          if (text) {
            safe.push({
              type: "callout",
              display_order: order,
              data: { tone, text, title },
            })
          } else {
            console.warn("[info-articles] Skip invalid callout block", { order, d })
          }
          break
        }

        case "evaluation": {
          const d = rb.data as any
          const hasAny =
            d &&
            (d.tier_rank !== undefined ||
              d.max_damage !== undefined ||
              d.build_difficulty !== undefined ||
              d.stat_accessibility !== undefined ||
              d.stat_stability !== undefined ||
              d.eval_value !== undefined ||
              d.eval_count !== undefined)
          if (hasAny) {
            safe.push({
              type: "evaluation",
              display_order: order,
              data: {
                tier_rank: d?.tier_rank,
                max_damage: d?.max_damage,
                build_difficulty: d?.build_difficulty,
                stat_accessibility: d?.stat_accessibility,
                stat_stability: d?.stat_stability,
                eval_value: typeof d?.eval_value === "number" ? d.eval_value : undefined,
                eval_count: typeof d?.eval_count === "number" ? d.eval_count : undefined,
              },
            })
          } else {
            console.warn("[info-articles] Skip invalid evaluation block", { order, d })
          }
          break
        }

        case "cards-table": {
          const d = rb.data as any
          const itemsRaw = Array.isArray(d?.items) ? d.items : []
          const items = itemsRaw
            .map((it: any) => {
              const card_id = typeof it?.card_id === "number" || typeof it?.card_id === "string" ? it.card_id : null
              const quantity = typeof it?.quantity === "number" && it.quantity > 0 ? Math.floor(it.quantity) : 1
              const name = typeof it?.name === "string" ? it.name : undefined
              const id = typeof it?.id === "string" ? it.id : undefined
              const explanation = typeof it?.explanation === "string" ? it.explanation : undefined
              return card_id ? { card_id, quantity, name, id, explanation } : null
            })
            .filter(Boolean) as {
            card_id: string | number
            quantity: number
            name?: string
            id?: string
            explanation?: string
          }[]

          // ヘッダー情報の処理
          const headers =
            d?.headers && typeof d.headers === "object"
              ? {
                  id: typeof d.headers.id === "string" ? d.headers.id : undefined,
                  card: typeof d.headers.card === "string" ? d.headers.card : undefined,
                  explanation: typeof d.headers.explanation === "string" ? d.headers.explanation : undefined,
                  quantity: typeof d.headers.quantity === "string" ? d.headers.quantity : undefined,
                }
              : undefined

          if (items.length > 0) {
            safe.push({
              type: "cards-table",
              display_order: order,
              data: { items, headers },
            })
          } else {
            console.warn("[info-articles] Skip invalid cards-table block", { order, d })
          }
          break
        }

        case "pickup": {
          const d = rb.data as any
          const itemsRaw = Array.isArray(d?.items) ? d.items : []
          const items = itemsRaw
            .map((it: any) => {
              const label = typeof it?.label === "string" ? it.label.trim() : ""
              const href = typeof it?.href === "string" ? it.href : undefined
              return label ? { label, href } : null
            })
            .filter(Boolean) as { label: string; href?: string }[]
          if (items.length > 0) {
            safe.push({
              type: "pickup",
              display_order: order,
              data: { title: typeof d?.title === "string" ? d.title : undefined, items },
            })
          } else {
            console.warn("[info-articles] Skip invalid pickup block", { order, d })
          }
          break
        }

        case "button": {
          const d = rb.data as any
          const label = typeof d?.label === "string" ? d.label.trim() : ""
          const href = typeof d?.href === "string" ? d.href : ""
          if (label && isHttpishUrl(href)) {
            safe.push({ type: "button", display_order: order, data: { label, href } })
          } else {
            console.warn("[info-articles] Skip invalid button block", { order, d })
          }
          break
        }

        default: {
          console.warn("[info-articles] Skip unknown block type", { order, type: rb.type })
          break
        }
      }
    } catch (e) {
      console.warn("[info-articles] Skip block due to validation error", {
        order,
        type: rb.type,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  return safe.sort((a, b) => a.display_order - b.display_order)
}

export async function getInfoList(limit = 12, offset = 0): Promise<InfoArticle[]> {
  const supabase = await supabaseServer()
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .from("info_articles")
    .select("id,title,excerpt,thumbnail_image_url,tags,category,published_at,pinned,priority")
    .eq("is_published", true)
    .lte("published_at", nowIso)
    .order("pinned", { ascending: false })
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`getInfoList failed: ${error.message}`)
  }
  return (data ?? []) as InfoArticle[]
}

export async function getInfoDetailById(id: string): Promise<{ meta: InfoArticleMeta; blocks: Block[] }> {
  const supabase = await supabaseServer()
  const nowIso = new Date().toISOString()

  const { data: meta, error: e1 } = await supabase
    .from("info_articles")
    .select("id,title,excerpt,thumbnail_image_url,tags,category,published_at,pinned,priority,slug,updated_at")
    .eq("id", id)
    .eq("is_published", true)
    .lte("published_at", nowIso)
    .single()

  if (e1) {
    throw new Error(`getInfoDetailById meta failed: ${e1.message}`)
  }
  if (!meta) {
    throw new Error("Article not found")
  }

  const { data: rawBlocks, error: e2 } = await supabase
    .from("info_article_blocks")
    .select("display_order,type,data")
    .eq("article_id", id)
    .order("display_order", { ascending: true })

  if (e2) {
    throw new Error(`getInfoDetailById blocks failed: ${e2.message}`)
  }

  const safeBlocks = validateBlocks((rawBlocks ?? []) as RawDbBlock[])

  return {
    meta: meta as InfoArticleMeta,
    blocks: safeBlocks,
  }
}
