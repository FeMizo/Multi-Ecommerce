"use client"
import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useCartStore } from "@/stores/cart"
import { Button } from "@/components/ui/button"
import { CartDeliveryInfo } from "@/components/public/cart-delivery-info"
import { formatPrice } from "@/lib/utils"
import { plural } from "@/lib/plural"
import { formatVariantSelection } from "@/lib/product-variants"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"
export function CartStoreGroups({ onCheckout }: { onCheckout?: () => void }) {
  const { items, updateQuantity, removeItem } = useCartStore()
  const groups = new Map<string, typeof items>()
  for (const item of items) groups.set(item.storeId, [...(groups.get(item.storeId) ?? []), item])
  return <div className="divide-y divide-border">{Array.from(groups, ([storeId, products]) => <section key={storeId} aria-label={products[0].storeName} className="py-6 first:pt-0">
    <h2 className="text-xl font-semibold">{products[0].storeName}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{plural(products.reduce((sum, item) => sum + item.quantity, 0), "producto")}</p>
    <ul className="mt-4 divide-y divide-border">{products.map((item) => <li key={item.id} className="flex gap-3 py-4 first:pt-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><Image src={item.image || DEFAULT_PRODUCT_IMAGE} alt={item.name} fill sizes="64px" className="object-contain" /></div>
      <div className="min-w-0 flex-1">
        <p className="break-words font-medium leading-snug">{item.name}</p>
        {item.variantSelection?.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{formatVariantSelection(item.variantSelection)}</p>}
        <p className="mt-1 font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-lg border">
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-l-lg hover:bg-accent disabled:opacity-40" aria-label={`Disminuir cantidad de ${item.name}`} disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus aria-hidden="true" className="h-4 w-4" /></button>
            <span className="min-w-8 text-center tabular-nums" aria-live="polite" aria-label={`Cantidad: ${item.quantity}`}>{item.quantity}</span>
            <button type="button" className="flex h-11 w-11 items-center justify-center rounded-r-lg hover:bg-accent disabled:opacity-40" aria-label={`Aumentar cantidad de ${item.name}`} disabled={item.quantity >= 99} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus aria-hidden="true" className="h-4 w-4" /></button>
          </div>
          <button type="button" aria-label={`Eliminar ${item.name}`} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm underline underline-offset-4 hover:bg-accent" onClick={() => removeItem(item.id)}><Trash2 aria-hidden="true" className="h-4 w-4" />Eliminar</button>
        </div>
      </div>
    </li>)}</ul>
    <div className="my-4"><CartDeliveryInfo key={storeId} storeId={storeId} /></div>
    <div className="flex justify-between gap-3 border-t py-4 text-sm"><span>Subtotal de productos</span><strong className="tabular-nums">{formatPrice(products.reduce((sum, item) => sum + item.price * item.quantity, 0))}</strong></div>
    <Button asChild className="min-h-11 w-full whitespace-normal py-3 text-center" onClick={onCheckout}><Link href={`/checkout?storeId=${encodeURIComponent(storeId)}`}>Comprar en {products[0].storeName}</Link></Button>
  </section>)}</div>
}
