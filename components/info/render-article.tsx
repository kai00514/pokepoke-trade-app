import "server-only"
import Image from "next/image"
import { Star, ListIcon, ArrowRight } from "lucide-react"
import type { Block } from "@/lib/actions/info-articles"

export type TocHeading = {
  label: string
  id: string
  depth: 1 | 2 // H2 => 1, H3 => 2
}

export type NormalizedResult = {
  normalized: Block[]
  tocHeadings: TocHeading[]
}

/**
 * ASCII-only slugify for safe CSS selectors.
 * - Keep a-z, 0-9, hyphen
 * - Replace whitespace with hyphen
 * - Drop other chars (including CJK) to avoid percent-encoded hashes
 */
export function slugifyAscii(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  )
}

export function ensureUniqueId(base: string, used: Map<string, number>): string {
  const key = base || "section"
  const count = used.get(key) ?? 0
  if (count === 0) {
    used.set(key, 1)
    return key
  }
  const next = count + 1
  used.set(key, next)
  return `${key}-${next}`
}

function isHttpUrl(url?: string | null) {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

function aspectClass(aspect?: string) {
  switch (aspect) {
    case "1:1":
      return "aspect-square"
    case "4:3":
      return "aspect-[4/3]"
    default:
      return "aspect-[16/9]"
  }
}

/**
 * Normalize blocks before rendering:
 * - Heading anchors: ASCII-only, unique
 * - Build TOC from H2/H3 (ASCII anchors prevent querySelector errors)
 * - Image: default alt and aspect, skip non-http(s)
 * - List: trim items and drop empties
 */
export function normalizeBlocks(blocks: Block[], pageTitle?: string): NormalizedResult {
  const used = new Map<string, number>()
  const toc: TocHeading[] = []
  const normalized: Block[] = []

  for (const b of blocks) {
    if (b.type === "heading") {
      const text = (b as any).data?.text ?? ""
      const base = slugifyAscii((b as any).data?.anchorId || text)
      const id = ensureUniqueId(base, used)
      const level = (b as any).data?.level
      normalized.push({ ...b, data: { ...(b as any).data, anchorId: id } } as Block)
      if (level === 2 || level === 3) {
        toc.push({ label: text, id, depth: (level === 2 ? 1 : 2) as 1 | 2 })
      }
      continue
    }

    if (b.type === "image") {
      const url = (b as any).data?.url
      if (!isHttpUrl(url)) {
        console.warn("[render-article] Skip image without http(s) url:", url)
        continue
      }
      const alt =
        (b as any).data?.alt && (b as any).data?.alt.trim().length > 0
          ? (b as any).data?.alt
          : `画像: ${pageTitle ?? "記事"}`
      const aspect = (b as any).data?.aspect || "16:9"
      normalized.push({ ...b, data: { ...(b as any).data, url, alt, aspect } } as Block)
      continue
    }

    if (b.type === "list") {
      const items = ((b as any).data?.items || [])
        .map((x: any) => (typeof x === "string" ? x.trim() : ""))
        .filter(Boolean)
      if (items.length === 0) {
        console.warn("[render-article] Skip empty list block")
        continue
      }
      normalized.push({ ...b, data: { ...(b as any).data, items } } as Block)
      continue
    }

    normalized.push(b)
  }

  return { normalized, tocHeadings: toc }
}

/**
 * Render blocks with a sturdy, simple, gray-based tone and blue accents.
 * New mappings for: Pickup, TOC, H2/H3, Table, Button.
 */
export function RenderArticle({ blocks, pageTitle }: { blocks: Block[]; pageTitle: string }) {
  const { normalized, tocHeadings } = normalizeBlocks(blocks, pageTitle)

  return (
    <div className="space-y-8">
      {normalized.map((b, idx) => {
        switch (b.type) {
          case "heading": {
            const id = (b as any).data?.anchorId ?? undefined
            const text = (b as any).data?.text
            const level = (b as any).data?.level
            if (level === 1) {
              return (
                <header key={`h1-${idx}`} id={id} className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{text}</h1>
                </header>
              )
            }
            if (level === 2) {
              // Black rounded tab with yellow underline accent
              return (
                <section key={`h2-${idx}`} id={id} className="pt-2">
                  <div className="inline-block bg-slate-900 text-white rounded-t-xl px-4 py-2 text-base sm:text-lg font-semibold shadow-sm">
                    {text}
                  </div>
                  <div className="h-1 w-full bg-amber-400 rounded-b-sm" />
                </section>
              )
            }
            // H3: left black bar + gray label pill
            return (
              <div key={`h3-${idx}`} id={id} className="mt-2 flex items-center gap-3">
                <div className="h-6 w-1.5 bg-slate-900 rounded-sm" />
                <span className="inline-block bg-slate-100 text-slate-900 px-3 py-1 rounded-md font-semibold">
                  {text}
                </span>
              </div>
            )
          }

          case "paragraph": {
            return (
              <p key={`p-${idx}`} className="text-slate-800 leading-7 whitespace-pre-line">
                {(b as any).data?.text}
              </p>
            )
          }

          case "image": {
            const d = (b as any).data
            const aspect = aspectClass(d.aspect)
            return (
              <figure
                key={`img-${idx}`}
                className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden shadow-sm"
              >
                <div className={`relative w-full ${aspect} bg-slate-100`}>
                  <Image
                    src={d.url || "/placeholder.svg?height=600&width=1200&query=image-fallback"}
                    alt={d.alt ?? ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1024px"
                  />
                </div>
                {d.caption ? <figcaption className="px-4 py-2 text-sm text-slate-600">{d.caption}</figcaption> : null}
              </figure>
            )
          }

          case "list": {
            const d = (b as any).data
            if (d.style === "numbered") {
              return (
                <ol key={`ol-${idx}`} className="list-decimal pl-5 space-y-1 text-slate-800">
                  {d.items.map((it: string, i: number) => (
                    <li key={i}>{it}</li>
                  ))}
                </ol>
              )
            }
            return (
              <ul key={`ul-${idx}`} className="list-disc pl-5 space-y-1 text-slate-800">
                {d.items.map((it: string, i: number) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            )
          }

          case "table": {
            const d = (b as any).data
            const headers = d.headers as string[] | undefined
            const rows = d.rows as string[][]
            return (
              <div key={`tbl-${idx}`} className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-300">
                <table className="min-w-full text-sm">
                  {headers && headers.length > 0 ? (
                    <thead className="bg-slate-100 text-slate-800">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="px-4 py-3 border-b border-slate-300 text-center font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  ) : null}
                  <tbody>
                    {rows.map((r, ri) => (
                      <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        {r.map((c, ci) => (
                          <td
                            key={ci}
                            className="px-4 py-3 border-b border-slate-200 whitespace-pre-line text-slate-800 align-top"
                          >
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }

          case "toc": {
            if (!tocHeadings.length) return null
            return (
              <nav
                key={`toc-${idx}`}
                className="rounded-xl bg-white p-0 ring-1 ring-slate-300 overflow-hidden"
                aria-label="目次"
              >
                {/* Title row with left icon and yellow top border */}
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-dotted border-slate-300 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                  <ListIcon className="h-4 w-4 text-slate-700" aria-hidden />
                  <span className="text-slate-800 font-semibold">目次</span>
                </div>
                <ul className="px-4 py-3 space-y-2">
                  {tocHeadings.map((h, i) => (
                    <li key={i} className="list-disc list-inside">
                      <a href={`#${h.id}`} className="text-blue-700 hover:underline">
                        {h.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )
          }

          case "pickup": {
            const d = (b as any).data as { title?: string; items: { label: string; href?: string }[] }
            return (
              <section
                key={`pickup-${idx}`}
                className="rounded-xl bg-white ring-1 ring-red-300 p-4 sm:p-5 relative"
                aria-label="ピックアップ情報"
              >
                {/* Red pill label */}
                <div className="absolute -top-3 left-4">
                  <span className="inline-block bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm ring-1 ring-red-700/40">
                    {d.title || "ピックアップ情報"}
                  </span>
                </div>
                <ul className="mt-2 space-y-2">
                  {d.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Star className="h-4 w-4 text-red-500 shrink-0 mt-0.5" aria-hidden />
                      {it.href ? (
                        <a href={it.href} className="text-sky-700 hover:underline">
                          {it.label}
                        </a>
                      ) : (
                        <span className="text-sky-700">{it.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          }

          case "button": {
            const d = (b as any).data as { label: string; href: string }
            const external = /^https?:\/\//.test(d.href) ? { target: "_blank", rel: "noopener" } : {}
            return (
              <div key={`btn-${idx}`} className="my-2">
                <a
                  href={d.href}
                  {...external}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-sky-500 px-4 py-3 text-sky-700 font-semibold hover:bg-sky-50 transition-colors"
                >
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  <span>{d.label}</span>
                </a>
              </div>
            )
          }

          case "related-links": {
            const d = (b as any).data
            const items = d.items || []
            if (!items.length) return null
            return (
              <div
                key={`links-${idx}`}
                className="rounded-xl bg-white p-4 sm:p-6 ring-1 ring-slate-300"
                role="region"
                aria-label="関連リンク"
              >
                <h2 className="text-base font-semibold text-slate-900 mb-2">関連リンク</h2>
                <ul className="space-y-2">
                  {items.map((it: any, i: number) => {
                    const isExternal = /^https?:\/\//.test(it.href)
                    return (
                      <li key={i} className="list-disc list-inside">
                        <a
                          href={it.href}
                          className="text-blue-700 hover:underline"
                          {...(isExternal ? { target: "_blank", rel: "noopener" } : {})}
                        >
                          {it.label}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          }

          case "divider": {
            return <hr key={`div-${idx}`} className="border-slate-300" />
          }

          case "callout": {
            const d = (b as any).data as { tone?: "info" | "warning" | "success"; text: string }
            const tone = d.tone || "info"
            const toneClasses =
              tone === "warning"
                ? "bg-amber-50 ring-amber-200 text-amber-900"
                : tone === "success"
                  ? "bg-emerald-50 ring-emerald-200 text-emerald-900"
                  : "bg-sky-50 ring-sky-200 text-sky-900"
            return (
              <div key={`callout-${idx}`} className={`rounded-xl ${toneClasses} ring-1 px-4 py-3`} role="note">
                <p className="text-sm whitespace-pre-line">{d.text}</p>
              </div>
            )
          }

          case "evaluation": {
            const d = (b as any).data
            const rows: [string, string][] = []
            if (d.tier_rank !== undefined) rows.push(["TIER", String(d.tier_rank)])
            if (d.max_damage !== undefined) rows.push(["最大ダメ", String(d.max_damage)])
            if (d.build_difficulty) rows.push(["構築難度", d.build_difficulty])
            if (d.stat_accessibility) rows.push(["使いやすさ", d.stat_accessibility])
            if (d.stat_stability) rows.push(["安定度", d.stat_stability])
            if (d.eval_value !== undefined || d.eval_count !== undefined) {
              const val =
                d.eval_value !== undefined
                  ? typeof d.eval_value === "number"
                    ? d.eval_value.toFixed(2)
                    : String(d.eval_value)
                  : "-"
              const cnt = d.eval_count !== undefined ? `(${d.eval_count})` : ""
              rows.push(["総合評価", `${val} ${cnt}`.trim()])
            }
            if (rows.length === 0) return null
            return (
              <div key={`eval-${idx}`} className="rounded-xl bg-white p-4 sm:p-6 ring-1 ring-slate-300">
                <h2 className="text-base font-semibold text-slate-900 mb-2">評価</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-[320px] text-sm">
                    <tbody>
                      {rows.map(([k, v], i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <th className="px-3 py-2 text-left text-slate-700 border-b border-slate-200 w-32">{k}</th>
                          <td className="px-3 py-2 text-slate-800 border-b border-slate-200 whitespace-pre-line">
                            {v}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }

          case "cards-table": {
            const d = (b as any).data
            const items = d.items || []
            if (!items.length) return null
            return (
              <div key={`cards-${idx}`} className="rounded-xl bg-white p-4 sm:p-6 ring-1 ring-slate-300">
                <h2 className="text-base font-semibold text-slate-900 mb-2">カード一覧</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-[360px] text-sm">
                    <thead className="bg-slate-100 text-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left border-b border-slate-300">カードID</th>
                        <th className="px-3 py-2 text-left border-b border-slate-300">名称</th>
                        <th className="px-3 py-2 text-left border-b border-slate-300">枚数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-3 py-2 border-b border-slate-200">{String(it.card_id)}</td>
                          <td className="px-3 py-2 border-b border-slate-200">{it.name ?? "-"}</td>
                          <td className="px-3 py-2 border-b border-slate-200">{it.quantity ?? 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }

          default:
            return null
        }
      })}
    </div>
  )
}
