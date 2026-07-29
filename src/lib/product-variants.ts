export type ProductVariantOption = {
  name: string
  values: string[]
}

export type ProductVariantSelection = {
  name: string
  value: string
}

export function normalizeVariantOptions(input: unknown): ProductVariantOption[] {
  if (!Array.isArray(input)) return []

  return input
    .slice(0, 5)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const candidate = entry as { name?: unknown; values?: unknown }
      const name = typeof candidate.name === "string" ? candidate.name.trim() : ""
      const values = Array.isArray(candidate.values)
        ? candidate.values
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .filter(Boolean)
            .slice(0, 20)
        : []
      const uniqueValues = [...new Set(values)]
      if (!name || uniqueValues.length === 0) return null
      return { name, values: uniqueValues }
    })
    .filter((entry): entry is ProductVariantOption => Boolean(entry))
}

export function defaultVariantSelection(options: ProductVariantOption[]) {
  return options
    .map((option) => ({ name: option.name, value: option.values[0] ?? "" }))
    .filter((entry) => entry.value)
}

export function variantSelectionKey(selection: ProductVariantSelection[]) {
  return selection.length
    ? selection.map((entry) => `${entry.name}:${entry.value}`).join("|")
    : "default"
}

export function formatVariantSelection(selection: ProductVariantSelection[]) {
  return selection.map((entry) => `${entry.name}: ${entry.value}`).join(" · ")
}
