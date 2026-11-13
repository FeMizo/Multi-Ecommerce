"use client"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { CartStoreGroups } from "@/components/products/cart-store-groups"
import { useCartStore } from "@/stores/cart"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { plural } from "@/lib/plural"
import { formatPrice } from "@/lib/utils"
import { buildCartWhatsAppMessage, buildWhatsAppShareUrl } from "@/lib/whatsapp-share"
export function CartDrawer() {
  const { items, isOpen, closeCart, total } = useCartStore()
  return <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}><SheetContent className="flex w-full flex-col p-0 sm:max-w-md"><SheetHeader className="border-b px-5 py-5"><SheetTitle>Mi carrito</SheetTitle><SheetDescription>{plural(items.reduce((sum, item) => sum + item.quantity, 0), "producto")}. Elige una tienda para continuar.</SheetDescription></SheetHeader>
    {items.length ? <><div className="min-h-0 flex-1 overflow-y-auto px-5 py-5"><CartStoreGroups onCheckout={closeCart} /></div><div className="space-y-2 border-t px-5 py-4"><Button asChild variant="outline" className="min-h-11 w-full" onClick={closeCart}><Link href="/cart">Ver carrito completo</Link></Button><a className="flex min-h-11 items-center justify-center text-sm underline underline-offset-4" href={buildWhatsAppShareUrl(buildCartWhatsAppMessage(items, total(), formatPrice))} target="_blank" rel="noopener noreferrer">Compartir carrito por WhatsApp</a></div></> : <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center"><ShoppingBag aria-hidden="true" className="h-12 w-12 text-muted-foreground" /><p>Tu carrito está vacío</p><Button asChild onClick={closeCart}><Link href="/search">Explorar productos</Link></Button></div>}
  </SheetContent></Sheet>
}
