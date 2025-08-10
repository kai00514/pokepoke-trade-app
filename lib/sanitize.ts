import sanitizeHtml from "sanitize-html"

/**
 * Sanitize HTML from CMS, allowing images, links, and iframes (YouTube, etc.).
 * Adds responsive classes to iframes.
 */
export function sanitizeCmsHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption", "iframe", "video", "source"]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "referrerpolicy", "title"],
      video: ["controls", "src", "poster", "width", "height"],
      source: ["src", "type"],
      "*": ["class", "style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      iframe: (tagName, attribs) => {
        // Force responsive iframe
        const attrs = {
          ...attribs,
          class: `${attribs.class ?? ""} aspect-video w-full h-auto`.trim(),
        }
        // security: ensure iframes are sandboxed minimally (optional)
        // attrs.sandbox = "allow-scripts allow-same-origin allow-presentation allow-popups"
        return { tagName: "iframe", attribs: attrs }
      },
      img: (tagName, attribs) => {
        const attrs = {
          ...attribs,
          loading: attribs.loading ?? "lazy",
          decoding: attribs.decoding ?? "async",
          class: `${attribs.class ?? ""} mx-auto`.trim(),
        }
        return { tagName: "img", attribs: attrs }
      },
      a: (tagName, attribs) => {
        const attrs = {
          ...attribs,
          rel: attribs.rel ?? "noopener noreferrer",
          target: attribs.target ?? "_blank",
        }
        return { tagName: "a", attribs: attrs }
      },
    },
  })
}
