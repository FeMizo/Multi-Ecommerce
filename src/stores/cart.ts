import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProductVariantSelection } from "@/lib/product-variants"

type CartItem = {
  id: string
  productId: string
  storeId: string
  name: string
  price: number
  image: string
  quantity: number
  storeName: string
  variantKey: string
  variantSelection: ProductVariantSelection[]
}

function isPersistedCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<CartItem>
  return [item.id, item.productId, item.storeId, item.variantKey].every((field) => typeof field === "string" && field.trim().length > 0)
    && [item.name, item.image, item.storeName].every((field) => typeof field === "string")
    && typeof item.quantity === "number" && Number.isSafeInteger(item.quantity) && item.quantity > 0
    && typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0
    && Number.isFinite(item.price * item.quantity)
    && Array.isArray(item.variantSelection) && item.variantSelection.every((selection) =>
      selection && typeof selection === "object"
      && typeof selection.name === "string" && selection.name.trim().length > 0
      && typeof selection.value === "string" && selection.value.trim().length > 0
    )
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  moveItemRelative: (itemId: string, targetId: string, position: "before" | "after") => void
  moveItemToTop: (itemId: string) => void
  removeStoreItems: (storeId: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, image: item.image, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                variantKey: item.variantKey || item.productId,
                variantSelection: item.variantSelection ?? [],
                quantity: 1,
              },
            ],
          }
        }),
      removeItem: (itemId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),
      updateQuantity: (itemId, quantity) => {
        if (!Number.isSafeInteger(quantity) || quantity < 0) return
        set((state) => ({
          items:
            quantity === 0
              ? state.items.filter((i) => i.id !== itemId)
              : state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        }))
      },
      moveItemRelative: (itemId, targetId, position) =>
        set((state) => {
          const sourceIndex = state.items.findIndex((item) => item.id === itemId)
          if (sourceIndex === -1) return state

          const items = [...state.items]
          const [movedItem] = items.splice(sourceIndex, 1)
          const targetIndex = items.findIndex((item) => item.id === targetId)
          if (targetIndex === -1) return state

          const insertIndex = position === "after" ? targetIndex + 1 : targetIndex
          items.splice(insertIndex, 0, movedItem)
          return { items }
        }),
      moveItemToTop: (itemId) =>
        set((state) => {
          const index = state.items.findIndex((item) => item.id === itemId)
          if (index <= 0) return state

          const items = [...state.items]
          const [item] = items.splice(index, 1)
          items.unshift(item)
          return { items }
        }),
      removeStoreItems: (storeId) =>
        set((state) => ({ items: state.items.filter((i) => i.storeId !== storeId) })),
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      total: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    {
      name: "cart-store",
      version: 2,
      merge: (persistedState, currentState) => {
        if (persistedState === undefined) return currentState
        const state = persistedState as Partial<CartStore> | null
        return {
          ...currentState,
          items: Array.isArray(state?.items)
            ? state.items.filter(isPersistedCartItem)
            : [],
        }
      },
      migrate: (persistedState) => {
        const state = persistedState as Partial<CartStore> & { items?: Partial<CartItem>[] } | undefined
        return {
          items: (Array.isArray(state?.items) ? state.items : []).filter((item) => item && typeof item === "object").map((item) => ({
            id: item.id ?? item.productId ?? "",
            productId: item.productId ?? item.id ?? "",
            storeId: item.storeId ?? "",
            name: item.name ?? "",
            price: item.price,
            image: item.image ?? "",
            quantity: item.quantity ?? 1,
            storeName: item.storeName ?? "",
            variantKey: item.variantKey ?? item.productId ?? item.id ?? "default",
            variantSelection: item.variantSelection ?? [],
          })).filter(isPersistedCartItem),
          isOpen: false,
        }
      },
      partialize: (state) => ({ items: state.items }),
    }
  )
)
