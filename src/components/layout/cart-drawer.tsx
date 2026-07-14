"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCartStore } from "@/stores/cart"
import { formatPrice } from "@/lib/utils"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, total } = useCartStore()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-5 border-b border-border/50">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block">Mi carrito</span>
              {items.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {items.reduce((acc, i) => acc + i.quantity, 0)} productos
                </span>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground">Explora productos y agrega tus favoritos</p>
            </div>
            <Button className="rounded-full px-6" onClick={closeCart} asChild>
              <Link href="/search">
                Explorar productos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    <Image
                      src={item.image || DEFAULT_PRODUCT_IMAGE}
                      alt={item.image ? item.name : `Imagen genérica de ${item.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.storeName}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        aria-label="Eliminar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center rounded-full border border-border/50 bg-background">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-l-full transition-colors"
                          aria-label="Disminuir"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="h-8 w-10 flex items-center justify-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-r-full transition-colors"
                          aria-label="Aumentar"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-bold tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/50 bg-muted/30">
              {/* Summary */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatPrice(total())}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="text-success font-medium">Gratis</span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(total())}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="px-6 pb-6 space-y-3">
                <Button className="w-full h-12 rounded-xl text-base" size="lg" asChild onClick={closeCart}>
                  <Link href="/checkout">
                    Finalizar compra
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full h-11 rounded-xl" onClick={closeCart} asChild>
                  <Link href="/cart">Ver carrito completo</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
