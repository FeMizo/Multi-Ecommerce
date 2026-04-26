"use client"

import { useEffect } from "react"
import { useCartStore } from "@/stores/cart"

export function ClearCartOnSuccess() {
  const clearCart = useCartStore((s) => s.clearCart)
  useEffect(() => {
    clearCart()
  }, [clearCart])
  return null
}
