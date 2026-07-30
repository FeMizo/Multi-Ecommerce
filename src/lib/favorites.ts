export const FAVORITES_STORAGE_KEY = "aionsite:favorites"
const FAVORITES_CHANGE_EVENT = "aionsite:favorites-change"
let cachedFavoritesRaw: string | null = null
let cachedFavoritesSnapshot: FavoriteProduct[] = []

export type FavoriteProduct = {
  id: string
  name: string
  slug: string
  storeId: string
  storeName: string
  storeSlug: string | null
  price: number
  comparePrice: number | null
  image: string
  updatedAt: string
}

function isFavoriteProduct(value: unknown): value is FavoriteProduct {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<FavoriteProduct>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.storeId === "string" &&
    typeof candidate.storeName === "string" &&
    (typeof candidate.storeSlug === "string" || candidate.storeSlug === null) &&
    typeof candidate.price === "number" &&
    (typeof candidate.comparePrice === "number" || candidate.comparePrice === null) &&
    typeof candidate.image === "string" &&
    typeof candidate.updatedAt === "string"
  )
}

export function readFavoritesFromStorage(): FavoriteProduct[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (raw === cachedFavoritesRaw) return cachedFavoritesSnapshot

    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    cachedFavoritesRaw = raw
    cachedFavoritesSnapshot = parsed.filter(isFavoriteProduct).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return cachedFavoritesSnapshot
  } catch {
    return []
  }
}

export function writeFavoritesToStorage(favorites: FavoriteProduct[]) {
  if (typeof window === "undefined") return
  const raw = JSON.stringify(favorites)
  cachedFavoritesRaw = raw
  cachedFavoritesSnapshot = favorites
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, raw)
  window.dispatchEvent(new Event(FAVORITES_CHANGE_EVENT))
}

export function subscribeToFavorites(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== FAVORITES_STORAGE_KEY) return
    onStoreChange()
  }

  const handleChange = () => onStoreChange()

  window.addEventListener("storage", handleStorage)
  window.addEventListener(FAVORITES_CHANGE_EVENT, handleChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(FAVORITES_CHANGE_EVENT, handleChange)
  }
}

export function upsertFavorite(product: FavoriteProduct) {
  const favorites = readFavoritesFromStorage()
  const nextFavorites = [
    { ...product, updatedAt: new Date().toISOString() },
    ...favorites.filter((favorite) => favorite.id !== product.id),
  ]

  writeFavoritesToStorage(nextFavorites)
  return nextFavorites
}

export function removeFavorite(productId: string) {
  const nextFavorites = readFavoritesFromStorage().filter((favorite) => favorite.id !== productId)
  writeFavoritesToStorage(nextFavorites)
  return nextFavorites
}
