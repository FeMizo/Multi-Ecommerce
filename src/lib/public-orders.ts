export function normalizePublicOrderRef(value: string) {
  const normalized = decodeURIComponent(value)
    .trim()
    .replace(/^#+/, "")
    .trim()

  return normalized || null
}
