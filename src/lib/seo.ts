const BASE_KEYWORDS = ["Carmen", "AionSite Shop", "marketplace local", "compras en linea", "tienda online"]

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").replace(/[^\p{L}\p{N}\s-]/gu, "")
}

export function buildKeywords(title: string, extras: string[] = []) {
  const cleanTitle = normalizeTitle(title)
  const lowerTitle = cleanTitle.toLowerCase()
  const titleKeywords = cleanTitle
    ? [
        cleanTitle,
        `${cleanTitle} en Mexico`,
        `${cleanTitle} local`,
        `${cleanTitle} online`,
        `${lowerTitle} mexico`,
      ]
    : []

  return Array.from(new Set([...titleKeywords, ...extras, ...BASE_KEYWORDS].filter(Boolean)))
}
