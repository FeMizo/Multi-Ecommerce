"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/stores/cart"
import { toast } from "sonner"

type ProductCardProps = {
  product: {
    id: string
    name: string
    slug: string
    storeId: string
    price: number
    comparePrice?: number | null
    images: string[]
    store: {
      name: string
      slug?: string
      city?: { name: string } | null
    }
  }
  storeSlug?: string
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  const href = storeSlug
    ? `/${storeSlug}/${product.slug}`
    : `/products/${product.slug}`

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem({
      id: product.id,
      productId: product.id,
      storeId: product.storeId,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
      storeName: product.store.name,
    })
    openCart()
  }

  return (
    <Link href={href} className="group">
      <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative aspect-square bg-muted">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Sin imagen
            </div>
          )}
          {discount && (
            <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-500">
              -{discount}%
            </Badge>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3" />
            {product.store.name}{product.store.city ? ` · ${product.store.city.name}` : ""}
          </p>
          <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">{formatPrice(product.price)}</p>
              {product.comparePrice && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </p>
              )}
            </div>
            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
