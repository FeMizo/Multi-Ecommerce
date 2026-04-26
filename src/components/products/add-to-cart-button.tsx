"use client"

import { useState } from "react"
import { ShoppingCart, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart"
import { toast } from "sonner"

type Props = {
  product: {
    id: string
    name: string
    price: number
    images: string[]
    stock: number
    storeId: string
    store: { name: string }
  }
}

export function AddToCartButton({ product }: Props) {
  const [qty, setQty] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  function handleAdd() {
    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id,
        productId: product.id,
        storeId: product.storeId,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? "",
        storeName: product.store.name,
      })
    }
    openCart()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Cantidad</span>
        <div className="flex items-center border rounded-md">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-9 w-9 flex items-center justify-center hover:bg-accent rounded-l-md"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="h-9 w-10 flex items-center justify-center text-sm font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            className="h-9 w-9 flex items-center justify-center hover:bg-accent rounded-r-md"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Button size="lg" className="w-full" onClick={handleAdd} disabled={product.stock === 0}>
        <ShoppingCart className="mr-2 h-5 w-5" />
        {product.stock === 0 ? "Sin stock" : "Agregar al carrito"}
      </Button>
    </div>
  )
}
