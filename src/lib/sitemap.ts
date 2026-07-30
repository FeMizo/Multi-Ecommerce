import { absoluteUrl } from "@/lib/site-url"

type SitemapEntry = {
  loc: string
  lastmod?: Date | string
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: number
  images?: string[]
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function toAbsolute(value: string) {
  return value.startsWith("http://") || value.startsWith("https://") ? value : absoluteUrl(value)
}

function formatDate(value?: Date | string) {
  if (!value) return null
  const date = typeof value === "string" ? new Date(value) : value
  return date.toISOString()
}

export function renderSitemapIndex(entries: Array<{ loc: string; lastmod?: Date | string }>) {
  const body = entries
    .map((entry) => {
      const lastmod = formatDate(entry.lastmod)
      return `\n  <sitemap>\n    <loc>${escapeXml(toAbsolute(entry.loc))}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n  </sitemap>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}\n</sitemapindex>\n`
}

export function renderUrlSet(entries: SitemapEntry[]) {
  const body = entries
    .map((entry) => {
      const lastmod = formatDate(entry.lastmod)
      const imageXml = (entry.images ?? [])
        .map((image) => `\n    <image:image><image:loc>${escapeXml(toAbsolute(image))}</image:loc></image:image>`)
        .join("")

      return `\n  <url>\n    <loc>${escapeXml(toAbsolute(entry.loc))}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}${entry.changefreq ? `\n    <changefreq>${entry.changefreq}</changefreq>` : ""}${typeof entry.priority === "number" ? `\n    <priority>${entry.priority.toFixed(1)}</priority>` : ""}${imageXml}\n  </url>`
    })
    .join("")

  const hasImages = entries.some((entry) => (entry.images?.length ?? 0) > 0)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ""}>${body}\n</urlset>\n`
}

