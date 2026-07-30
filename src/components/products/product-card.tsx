"use client"

import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Heart, ShoppingCart } from "lucide-react"
import { useMemo, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/stores/cart"
import { withProductPlaceholder } from "@/lib/placeholders"
import {
  defaultVariantSelection,
  getVariantQuantityLimit,
  normalizeVariantOptions,
  variantSelectionKey,
} from "@/lib/product-variants"
import { readFavoritesFromStorage, removeFavorite, subscribeToFavorites, upsertFavorite } from "@/lib/favorites"

const EMPTY_FAVORITES: readonly [] = []

type ProductCardProps = {
  product: {
    id: string
    name: string
    slug: string
    storeId: string
    price: number
    comparePrice?: number | null
    images: string[]
    manageStock: boolean
    stock: number
    variantOptions?: unknown
    store: {
      name: string
      slug?: string
      primaryColor?: string | null
    }
  }
  storeSlug?: string
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const { data: session } = useSession()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const imageSrc = withProductPlaceholder(product.images)
  const variantOptions = useMemo(() => normalizeVariantOptions(product.variantOptions ?? []), [product.variantOptions])
  const defaultSelection = defaultVariantSelection(variantOptions)
  const variantKey = variantSelectionKey(defaultSelection)
  const stockLimit = product.manageStock
    ? (getVariantQuantityLimit(variantOptions, defaultSelection) ?? product.stock)
    : 30
  const canAdd = (product.manageStock ? stockLimit > 0 : true) && variantOptions.every((option, index) => Boolean(defaultSelection[index]?.value))

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  const href = storeSlug ? `/${storeSlug}/${product.slug}` : `/products/${product.slug}`
  const favorites = useSyncExternalStore(subscribeToFavorites, readFavoritesFromStorage, () => EMPTY_FAVORITES)
  const isLiked = favorites.some((favorite) => favorite.id === product.id)
  const canUseFavorites = Boolean(session?.user)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!canAdd) return
    addItem({
      id: `${product.id}:${variantKey}`,
      variantKey,
      variantSelection: defaultSelection,
      productId: product.id,
      storeId: product.storeId,
      name: product.name,
      price: product.price,
      image: imageSrc,
      storeName: product.store.name,
    })
    openCart()
  }

  function handleLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!canUseFavorites) {
      toast.error("Debes iniciar sesion para usar favoritos.")
      return
    }

    if (isLiked) {
      removeFavorite(product.id)
      return
    }

    upsertFavorite({
      id: product.id,
      name: product.name,
      slug: product.slug,
      storeId: product.storeId,
      storeName: product.store.name,
      storeSlug: storeSlug ?? product.store.slug ?? null,
      price: product.price,
      comparePrice: product.comparePrice ?? null,
      image: imageSrc,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <Link
      href={href}
      className="group block"
      style={product.store.primaryColor ? ({ "--primary": product.store.primaryColor, "--primary-foreground": "#ffffff" } as React.CSSProperties) : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden hover-lift">
        <div className="relative aspect-square bg-muted/30 overflow-hidden">
          {!imageLoaded && <div className="absolute inset-0 shimmer" />}

          <Image
            src={imageSrc}
            alt={product.images[0] ? product.name : `Imagen generica de ${product.name}`}
            fill
            className={`object-cover transition-all duration-700 ${
              isHovered ? "scale-110" : "scale-100"
            } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />

          <div
            className={`absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />

          {discount && (
            <Badge className="absolute top-3 left-3 bg-destructive hover:bg-destructive text-primary-foreground font-bold px-3 py-1.5 rounded-full shadow-lg text-xs">
              -{discount}%
            </Badge>
          )}

          <button
            type="button"
            onClick={handleLike}
            aria-label={canUseFavorites ? (isLiked ? "Quitar de favoritos" : "Agregar a favoritos") : "Inicia sesion para usar favoritos"}
            aria-pressed={isLiked}
            title={canUseFavorites ? undefined : "Debes iniciar sesion para usar favoritos"}
            aria-disabled={!canUseFavorites}
            className={`absolute top-3 right-3 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isLiked
                ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30"
                : "bg-card/90 backdrop-blur-sm text-foreground hover:bg-card hover:scale-110 shadow-md"
            } ${!canUseFavorites ? "opacity-70 cursor-not-allowed hover:scale-100" : ""}`}
          >
            <Heart className={`h-4 w-4 transition-transform ${isLiked ? "fill-current scale-110" : ""}`} />
          </button>

          <div
            className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              onClick={handleAddToCart}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground shadow-xl btn-shine"
              disabled={!canAdd}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar al carrito
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-5">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
            <span className="truncate">{product.store.name}</span>
          </p>

          <h3 className={`font-semibold text-sm md:text-base line-clamp-2 mb-3 min-h-10 transition-colors leading-snug ${isHovered ? "text-primary" : ""}`}>
            {product.name}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <p className="font-bold text-xl text-foreground">{formatPrice(product.price)}</p>
              {product.comparePrice && <p className="text-xs text-muted-foreground line-through">{formatPrice(product.comparePrice)}</p>}
            </div>

            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 shrink-0 rounded-xl border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-all lg:hidden"
              onClick={handleAddToCart}
              disabled={!canAdd}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
