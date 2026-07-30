"use client"

import { useMemo, useState } from "react"
import { ShoppingCart, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart"
import { withProductPlaceholder } from "@/lib/placeholders"
import {
  defaultVariantSelection,
  formatVariantSelection,
  getVariantQuantityLimit,
  normalizeVariantOptions,
  variantSelectionKey,
  type ProductVariantSelection,
} from "@/lib/product-variants"

type Props = {
  product: {
    id: string
    name: string
    price: number
    images: string[]
    stock: number
    manageStock: boolean
    storeId: string
    store: { name: string }
    variantOptions?: unknown
  }
}

export function AddToCartButton({ product }: Props) {
  const [qty, setQty] = useState(1)
  const [selected, setSelected] = useState<ProductVariantSelection[]>([])
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const variantOptions = useMemo(() => normalizeVariantOptions(product.variantOptions ?? []), [product.variantOptions])
  const [initialized] = useState(() => defaultVariantSelection(variantOptions))
  const currentSelection = selected.length > 0 ? selected : initialized
  const stockLimit = product.manageStock
    ? (getVariantQuantityLimit(variantOptions, currentSelection) ?? product.stock)
    : 30
  const maxQty = stockLimit

  function handleAdd() {
    if (qty < 1) return
    const variantKey = variantSelectionKey(currentSelection)
    for (let i = 0; i < qty; i++) {
      addItem({
        id: `${product.id}:${variantKey}`,
        variantKey,
        variantSelection: currentSelection,
        productId: product.id,
        storeId: product.storeId,
        name: product.name,
        price: product.price,
        image: withProductPlaceholder(product.images),
        storeName: product.store.name,
      })
    }
    openCart()
  }

  const canAdd = (product.manageStock ? stockLimit > 0 : true) && variantOptions.every((option, index) => Boolean(currentSelection[index]?.value))

  return (
    <div className="flex flex-col gap-3">
      {variantOptions.length > 0 && (
        <div className="space-y-3">
          {variantOptions.map((option, index) => (
            <div key={option.name} className="space-y-1">
              <label className="text-sm font-medium">{option.name}</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={currentSelection[index]?.value ?? option.values[0]?.value ?? ""}
                onChange={(event) => {
                  const value = event.target.value
                  setSelected((prev) => {
                    const next = [...prev]
                    next[index] = { name: option.name, value }
                    return next
                  })
                }}
              >
                {option.values.map((value) => (
                  <option key={value.value} value={value.value}>
                    {value.value}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {selected.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Seleccionado: {formatVariantSelection(selected)}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Cantidad</span>
        <div className="flex items-center border rounded-md">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(0, q - 1))}
            className="h-9 w-9 flex items-center justify-center hover:bg-accent rounded-l-md"
            aria-label="Disminuir cantidad"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="h-9 w-10 flex items-center justify-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="h-9 w-9 flex items-center justify-center hover:bg-accent rounded-r-md"
            aria-label="Aumentar cantidad"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Button size="lg" className="w-full" onClick={handleAdd} disabled={!canAdd || qty < 1}>
        <ShoppingCart className="mr-2 h-5 w-5" />
        {product.manageStock && stockLimit === 0 ? "Sin stock" : "Agregar al carrito"}
      </Button>
    </div>
  )
}
