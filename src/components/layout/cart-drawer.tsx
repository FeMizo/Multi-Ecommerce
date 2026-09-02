"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, type DragEvent } from "react"
import { ArrowRight as MorphArrowRight, GripVertical as MorphGripVertical, Minus as MorphMinus, Plus as MorphPlus, ShoppingCart as MorphShoppingCart, SquareArrowOutUpRight as MorphArrowOutUpRight, X as MorphX } from "lucide"
import { InteractiveMorphIcon } from "@/components/ui/interactive-morph-icon"
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
import { buildCartWhatsAppMessage, buildWhatsAppChatUrl, resolveCartWhatsAppRecipient } from "@/lib/whatsapp-share"
import { formatVariantSelection } from "@/lib/product-variants"

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, moveItemRelative, total } = useCartStore()
  const [whatsappPhone, setWhatsappPhone] = useState<string | null>(null)
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<{ id: string; position: "before" | "after" } | null>(null)
  const [exploreHovered, setExploreHovered] = useState(false)
  const [checkoutHovered, setCheckoutHovered] = useState(false)

  useEffect(() => {
    let active = true

    async function loadRecipient() {
      if (items.length === 0) {
        setWhatsappPhone(null)
        return
      }

      setWhatsappLoading(true)
      const recipient = await resolveCartWhatsAppRecipient(items.map((item) => item.storeId))
      if (!active) return
      setWhatsappPhone(recipient?.phone ?? null)
      setWhatsappLoading(false)
    }

    loadRecipient()

    return () => {
      active = false
    }
  }, [items])

  async function shareCartByWhatsApp() {
    if (!whatsappPhone) return
    const message = buildCartWhatsAppMessage(items, total(), formatPrice)
    const popup = window.open("about:blank", "_blank")
    const url = buildWhatsAppChatUrl(whatsappPhone, message)
    if (popup) {
      popup.location.href = url
      popup.opener = null
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }

  function handleDragStart(itemId: string) {
    setDraggedItemId(itemId)
  }

  function handleDragEnd() {
    setDraggedItemId(null)
    setDropHint(null)
  }

  function handleDragOver(itemId: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (!draggedItemId || draggedItemId === itemId) return
    const rect = event.currentTarget.getBoundingClientRect()
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after"
    setDropHint({ id: itemId, position })
  }

  function handleDrop(itemId: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (!draggedItemId || draggedItemId === itemId) return
    const rect = event.currentTarget.getBoundingClientRect()
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after"
    moveItemRelative(draggedItemId, itemId, position)
    setDraggedItemId(null)
    setDropHint(null)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-5 border-b border-border/50">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <InteractiveMorphIcon icon={MorphShoppingCart} className="h-5 w-5 text-primary" spring="snappy" reducedMotion="never" />
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
              <InteractiveMorphIcon icon={MorphShoppingCart} className="h-10 w-10 text-muted-foreground/40" spring="snappy" reducedMotion="never" />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground">Explora productos y agrega tus favoritos</p>
            </div>
            <Button
              className="rounded-full px-6"
              onClick={closeCart}
              onPointerEnter={() => setExploreHovered(true)}
              onPointerLeave={() => setExploreHovered(false)}
              onFocus={() => setExploreHovered(true)}
              onBlur={() => setExploreHovered(false)}
              asChild
            >
              <Link href="/search">
                Explorar productos
                <InteractiveMorphIcon
                  icon={MorphArrowRight}
                  hoverIcon={MorphArrowOutUpRight}
                  hovered={exploreHovered}
                  className="ml-2 h-4 w-4"
                  spring="snappy"
                  reducedMotion="never"
                />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {items.length > 1 && (
              <div className="mx-6 mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary">
                Pon primero el producto que quieres pedir. El checkout tomara solo la tienda del primer producto.
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(event) => handleDragOver(item.id, event)}
                  onDrop={(event) => handleDrop(item.id, event)}
                  className={[
                    "flex gap-4 p-3 rounded-xl bg-muted/30 border border-border/50 transition-colors cursor-grab active:cursor-grabbing",
                    dropHint?.id === item.id && dropHint.position === "before" ? "border-primary/60 bg-primary/5" : "",
                    dropHint?.id === item.id && dropHint.position === "after" ? "border-primary/60 bg-primary/5" : "",
                    draggedItemId === item.id ? "opacity-70" : "",
                  ].join(" ")}
                >
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                          {items[0]?.id === item.id && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              Primero
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.storeName}</p>
                        {(item.variantSelection?.length ?? 0) > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatVariantSelection(item.variantSelection ?? [])}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          draggable={false}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          aria-label="Arrastrar para ordenar"
                          title="Arrastrar para ordenar"
                        >
                          <InteractiveMorphIcon icon={MorphGripVertical} className="h-4 w-4" spring="snappy" reducedMotion="never" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                          aria-label="Eliminar"
                        >
                          <InteractiveMorphIcon icon={MorphX} className="h-4 w-4" spring="snappy" reducedMotion="never" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center rounded-full border border-border/50 bg-background">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-l-full transition-colors"
                          aria-label="Disminuir"
                        >
                          <InteractiveMorphIcon icon={MorphMinus} className="h-3.5 w-3.5" spring="snappy" reducedMotion="never" />
                        </button>
                        <span className="h-8 w-10 flex items-center justify-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-r-full transition-colors"
                          aria-label="Aumentar"
                        >
                          <InteractiveMorphIcon icon={MorphPlus} className="h-3.5 w-3.5" spring="snappy" reducedMotion="never" />
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
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatPrice(total())}</span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(total())}</span>
                </div>
              </div>

              <div className="px-6 pb-6 space-y-3">
                <Button
                  className="w-full h-12 rounded-xl text-base"
                  size="lg"
                  asChild
                  onClick={closeCart}
                  onPointerEnter={() => setCheckoutHovered(true)}
                  onPointerLeave={() => setCheckoutHovered(false)}
                  onFocus={() => setCheckoutHovered(true)}
                  onBlur={() => setCheckoutHovered(false)}
                >
                    <Link href="/checkout">
                      Finalizar compra
                    <InteractiveMorphIcon
                      icon={MorphArrowRight}
                      hoverIcon={MorphArrowOutUpRight}
                      hovered={checkoutHovered}
                      className="ml-2 h-4 w-4"
                      spring="snappy"
                      reducedMotion="never"
                    />
                  </Link>
                </Button>
                {whatsappLoading || whatsappPhone ? (
                  <div className="space-y-2">
                    {whatsappLoading ? (
                      <Button type="button" variant="outline" className="w-full h-11 rounded-xl" disabled>
                        Verificando WhatsApp...
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" className="w-full h-11 rounded-xl" onClick={shareCartByWhatsApp}>
                        Enviar por WhatsApp
                      </Button>
                    )}
                  </div>
                ) : null}
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


