export type ProductVariantValue = {
  value: string
  quantity?: number | null
}

export type ProductVariantOption = {
  name: string
  values: ProductVariantValue[]
}

export type ProductVariantSelection = {
  name: string
  value: string
}

function normalizeQuantity(input: unknown) {
  return typeof input === "number" && Number.isInteger(input) && input > 0 ? input : null
}

function normalizeVariantValue(entry: unknown): ProductVariantValue | null {
  if (typeof entry === "string") {
    const value = entry.trim()
    return value ? { value } : null
  }

  if (!entry || typeof entry !== "object") return null
  const candidate = entry as { value?: unknown; quantity?: unknown }
  const value = typeof candidate.value === "string" ? candidate.value.trim() : ""
  if (!value) return null
  return { value, quantity: normalizeQuantity(candidate.quantity) }
}

export function normalizeVariantOptions(input: unknown): ProductVariantOption[] {
  if (!Array.isArray(input)) return []

  return input
    .slice(0, 5)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const candidate = entry as { name?: unknown; values?: unknown; quantity?: unknown }
      const name = typeof candidate.name === "string" ? candidate.name.trim() : ""
      if (!name) return null

      const values = Array.isArray(candidate.values)
        ? candidate.values.map((value) => normalizeVariantValue(value)).filter((value): value is ProductVariantValue => Boolean(value))
        : []

      if (values.length === 0) return null

      const seen = new Set<string>()
      const uniqueValues = values.filter((value) => {
        const key = value.value.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      if (uniqueValues.length === 0) return null

      const optionQuantity = normalizeQuantity(candidate.quantity)
      if (optionQuantity !== null && uniqueValues.every((value) => value.quantity == null)) {
        return {
          name,
          values: uniqueValues.map((value) => ({ ...value, quantity: optionQuantity })),
        }
      }

      return {
        name,
        values: uniqueValues,
      }
    })
    .filter((entry): entry is ProductVariantOption => Boolean(entry))
}

export function defaultVariantSelection(options: ProductVariantOption[]) {
  return options
    .map((option) => ({ name: option.name, value: option.values[0]?.value ?? "" }))
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

export function getDuplicateVariantNames(options: ProductVariantOption[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const option of options) {
    const normalized = option.name.trim().toLowerCase()
    if (!normalized) continue
    if (seen.has(normalized)) {
      duplicates.add(option.name.trim())
    } else {
      seen.add(normalized)
    }
  }

  return [...duplicates]
}

export function getVariantQuantityLimit(options: ProductVariantOption[], selection: ProductVariantSelection[]) {
  const selectedNames = new Map(selection.map((entry) => [entry.name.trim().toLowerCase(), entry.value.trim().toLowerCase()]))
  const quantities = options
    .map((option) => {
      const selectedValue = selectedNames.get(option.name.trim().toLowerCase())
      if (!selectedValue) return null
      const match = option.values.find((value) => value.value.trim().toLowerCase() === selectedValue)
      return normalizeQuantity(match?.quantity)
    })
    .filter((value): value is number => typeof value === "number")

  if (!quantities.length) return null
  return Math.min(...quantities)
}

export function sumVariantQuantities(options: ProductVariantOption[]) {
  return options.reduce((sum, option) => {
    return sum + option.values.reduce((innerSum, value) => innerSum + (value.quantity ?? 0), 0)
  }, 0)
}

