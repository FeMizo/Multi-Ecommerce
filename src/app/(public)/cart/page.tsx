"use client"

import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from "@/stores/cart"
import { formatPrice } from "@/lib/utils"

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
        <p className="text-muted-foreground mb-6">Agrega productos para comenzar</p>
        <Button asChild>
          <Link href="/search">Explorar productos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Carrito ({items.length})</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 p-4 rounded-xl border bg-card">
              <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.storeName}</p>
                <p className="font-bold mt-1">{formatPrice(item.price)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded-l-md"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="h-7 w-8 flex items-center justify-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded-r-md"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-6 space-y-4 sticky top-20">
            <h2 className="font-semibold text-lg">Resumen</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">{item.name} ×{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(total())}</span>
            </div>
            <Button className="w-full" size="lg" asChild>
              <Link href="/checkout">Proceder al pago</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/search">Seguir comprando</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
