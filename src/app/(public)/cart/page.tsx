"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"
import { CartStoreGroups } from "@/components/products/cart-store-groups"
import { useCartStore } from "@/stores/cart"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { plural } from "@/lib/plural"
import { buildCartWhatsAppMessage, buildWhatsAppShareUrl } from "@/lib/whatsapp-share"
export default function CartPage() {
  const { items, total } = useCartStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const frame = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(frame) }, [])
  if (!mounted) return null
  if (!items.length) return <div className="container mx-auto px-4 py-16 text-center"><ShoppingBag aria-hidden="true" className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h1 className="text-2xl font-semibold">Tu carrito está vacío</h1><p className="my-4 text-muted-foreground">Encuentra productos de tiendas locales para comenzar.</p><Button asChild><Link href="/search">Explorar productos</Link></Button></div>
  return <div className="container mx-auto max-w-3xl px-4 py-8"><h1 className="text-3xl font-semibold">Tu carrito</h1><p className="mt-2 text-muted-foreground">{plural(items.reduce((sum, item) => sum + item.quantity, 0), "producto")}. Compra en cada tienda por separado; los demás productos seguirán guardados.</p><div className="mt-8"><CartStoreGroups /></div><div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row"><Button variant="outline" className="min-h-11" asChild><a href={buildWhatsAppShareUrl(buildCartWhatsAppMessage(items, total(), formatPrice))} target="_blank" rel="noopener noreferrer">Compartir carrito por WhatsApp</a></Button><Button variant="ghost" className="min-h-11" asChild><Link href="/search">Seguir comprando</Link></Button></div></div>
}
