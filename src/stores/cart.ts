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
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
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
      updateQuantity: (itemId, quantity) =>
        set((state) => ({
          items:
            quantity === 0
              ? state.items.filter((i) => i.id !== itemId)
              : state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        })),
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
      migrate: (persistedState) => {
        const state = persistedState as Partial<CartStore> & { items?: Partial<CartItem>[] } | undefined
        return {
          items: (state?.items ?? []).map((item) => ({
            id: item.id ?? item.productId ?? crypto.randomUUID(),
            productId: item.productId ?? item.id ?? crypto.randomUUID(),
            storeId: item.storeId ?? "",
            name: item.name ?? "",
            price: item.price ?? 0,
            image: item.image ?? "",
            quantity: item.quantity ?? 1,
            storeName: item.storeName ?? "",
            variantKey: item.variantKey ?? item.productId ?? item.id ?? "default",
            variantSelection: item.variantSelection ?? [],
          })),
          isOpen: false,
        }
      },
      partialize: (state) => ({ items: state.items }),
    }
  )
)
