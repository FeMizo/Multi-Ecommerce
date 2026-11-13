export type ProductVariantValue = {
  value: string
  imageUrl?: string | null
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
  const candidate = entry as { value?: unknown; quantity?: unknown; imageUrl?: unknown; image?: unknown }
  const value = typeof candidate.value === "string" ? candidate.value.trim() : ""
  if (!value) return null
  const image = candidate.imageUrl ?? candidate.image
  const imageUrl = typeof image === "string" && /^(https?:\/\/|\/)/i.test(image) ? image : null
  return { value, quantity: normalizeQuantity(candidate.quantity), ...(imageUrl ? { imageUrl } : {}) }
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

export function productVariantIdentity(productId: string, selection: ProductVariantSelection[]) {
  const entries = selection.map((entry) => [entry.name.trim().toLowerCase(), entry.value.trim().toLowerCase()])
  entries.sort(([left], [right]) => left.localeCompare(right))
  return JSON.stringify([productId, entries])
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

export function isValidVariantSelection(options: ProductVariantOption[], selection: unknown): selection is ProductVariantSelection[] {
  if (!Array.isArray(selection) || selection.length !== options.length) return false
  if (!selection.every((entry): entry is ProductVariantSelection =>
    entry !== null && typeof entry === "object" && typeof entry.name === "string" && typeof entry.value === "string"
  )) return false
  const selectedNames = new Map(selection.map((entry) => [entry.name.trim().toLowerCase(), entry.value.trim().toLowerCase()]))
  return selectedNames.size === options.length && options.every((option) =>
    option.values.some((value) => value.value.trim().toLowerCase() === selectedNames.get(option.name.trim().toLowerCase()))
  )
}

export function getVariantQuantityLimit(options: ProductVariantOption[], selection: ProductVariantSelection[]) {
  if (!options.length) return null
  if (!isValidVariantSelection(options, selection)) return 0
  const selectedNames = new Map(selection.map((entry) => [entry.name.trim().toLowerCase(), entry.value.trim().toLowerCase()]))
  const quantities = options
    .map((option) => {
      const selectedValue = selectedNames.get(option.name.trim().toLowerCase())
      if (!selectedValue) return 0
      const match = option.values.find((value) => value.value.trim().toLowerCase() === selectedValue)
      if (!match) return 0
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

export function accumulateVariantQuantities(
  productId: string,
  options: ProductVariantOption[],
  selection: ProductVariantSelection[],
  quantity: number,
  requested: Map<string, number>,
) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || !isValidVariantSelection(options, selection)) return false
  const selected = new Map(selection.map((entry) => [entry.name.trim().toLowerCase(), entry.value.trim().toLowerCase()]))
  const pending: Array<{ key: string; quantity: number }> = []
  for (const option of options) {
    const name = option.name.trim().toLowerCase()
    const value = selected.get(name)
    const limit = normalizeQuantity(option.values.find((entry) => entry.value.trim().toLowerCase() === value)?.quantity)
    if (limit === null) continue
    const key = JSON.stringify([productId, name, value])
    const combined = (requested.get(key) ?? 0) + quantity
    if (!Number.isSafeInteger(combined) || combined > limit) return false
    pending.push({ key, quantity: combined })
  }
  for (const entry of pending) requested.set(entry.key, entry.quantity)
  return true
}


export function getVariantImage(options: ProductVariantOption[], selection: ProductVariantSelection[], images: string[]) {
  for (const option of options) {
    const selected = selection.find((entry) => entry.name.trim().toLowerCase() === option.name.trim().toLowerCase())
    const value = option.values.find((entry) => entry.value.trim().toLowerCase() === selected?.value.trim().toLowerCase())
    if (value?.imageUrl) return value.imageUrl
  }
  const variantImages = new Set(options.flatMap((option) => option.values.map((value) => value.imageUrl).filter(Boolean)))
  return images.find((image) => !variantImages.has(image)) ?? ""
}
