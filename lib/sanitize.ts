import sanitize from "sanitize-html"

/**
 * Sanitize HTML from microCMS for safe rendering in the app.
 * - Allows basic formatting, images, links.
 * - Allows iframes (YouTube/Vimeo) and makes them responsive via Tailwind classes.
 * - Forces external links to open in new tab with rel safety attributes.
 */
export function sanitizeNewsHtml(html: string): string {
  const clean = sanitize(html, {
    allowedTags: sanitize.defaults.allowedTags.concat(["img", "iframe", "figure", "figcaption"]),
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      img: ["src", "alt", "title", "width", "height", "loading"],
      a: ["href", "name", "target", "rel"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel", "data"],
    allowProtocolRelative: true,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || ""
        // Open external links in new tab with rel attributes
        const isExternal = href.startsWith("http")
        return {
          tagName: "a",
          attribs: isExternal
            ? {
                ...attribs,
                target: "_blank",
                rel: "noopener noreferrer",
              }
            : attribs,
        }
      },
      iframe: (tagName, attribs) => {
        // Restrict iframe src to allow only YouTube/Vimeo
        const src = attribs.src || ""
        const allowed =
          src.includes("youtube.com") ||
          src.includes("youtu.be") ||
          src.includes("player.vimeo.com") ||
          src.includes("vimeo.com")
        if (!allowed) {
          // Drop non-allowed iframes
          return { tagName: "div", text: "" }
        }
        // Make iframe responsive
        return {
          tagName: "iframe",
          attribs: {
            ...attribs,
            class: `${attribs.class || ""} w-full aspect-video rounded-xl`.trim(),
            frameborder: "0",
            allow:
              attribs.allow ||
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
            allowfullscreen: "true",
          },
        }
      },
      img: (tagName, attribs) => {
        // Ensure images are responsive
        return {
          tagName: "img",
          attribs: {
            ...attribs,
            loading: attribs.loading || "lazy",
            class: `${attribs.class || ""} max-w-full h-auto rounded-lg`.trim(),
          },
        }
      },
    },
  })
  return clean
}
