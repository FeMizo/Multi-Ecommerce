"use client"

import { useEffect } from "react"
import { useCartStore } from "@/stores/cart"

export function ClearCartOnSuccess({ storeId }: { storeId?: string | null }) {
  const clearCart = useCartStore((s) => s.clearCart)
  const removeStoreItems = useCartStore((s) => s.removeStoreItems)
  useEffect(() => {
    if (storeId) {
      removeStoreItems(storeId)
      return
    }
    clearCart()
  }, [clearCart, removeStoreItems, storeId])
  return null
}
