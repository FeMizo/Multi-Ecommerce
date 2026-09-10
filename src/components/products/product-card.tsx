"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useMemo, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"
import { Heart as MorphHeart, HeartPlus as MorphHeartPlus, ShoppingCart as MorphShoppingCart } from "lucide"
import { InteractiveMorphIcon } from "@/components/ui/interactive-morph-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/stores/cart"
import { withProductPlaceholder } from "@/lib/placeholders"
import type { FavoriteProduct } from "@/lib/favorites"
import {
  defaultVariantSelection,
  getVariantQuantityLimit,
  normalizeVariantOptions,
  variantSelectionKey,
  type ProductVariantSelection,
} from "@/lib/product-variants"
import { readFavoritesFromStorage, removeFavorite, subscribeToFavorites, upsertFavorite } from "@/lib/favorites"

const EMPTY_FAVORITES: readonly FavoriteProduct[] = []

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
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)
  const { data: session } = useSession()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFavoriteHovered, setIsFavoriteHovered] = useState(false)
  const imageSrc = withProductPlaceholder(product.images)
  const variantOptions = useMemo(() => normalizeVariantOptions(product.variantOptions ?? []), [product.variantOptions])
  const defaultSelection = defaultVariantSelection(variantOptions)
  const variantKey = variantSelectionKey(defaultSelection)
  const stockLimit = product.manageStock
    ? (getVariantQuantityLimit(variantOptions, defaultSelection) ?? product.stock)
    : 30
  const canAdd = variantOptions.length > 0 || ((product.manageStock ? stockLimit > 0 : true) && variantOptions.every((option, index) => Boolean(defaultSelection[index]?.value)))
  const hasVariantQuantities = variantOptions.some((option) => option.values.some((value) => value.quantity !== null && value.quantity !== undefined))
  const isOutOfStock = product.manageStock && (
    variantOptions.length === 0
      ? product.stock <= 0
      : hasVariantQuantities
        ? variantOptions.some((option) => {
            const quantities = option.values.map((value) => value.quantity).filter((quantity): quantity is number => typeof quantity === "number")
            return quantities.length > 0 && !quantities.some((quantity) => quantity > 0)
          })
        : product.stock <= 0
  )
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantSelection[]>(() => defaultVariantSelection(variantOptions))

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
    if (variantOptions.length > 0) {
      setVariantDialogOpen(true)
      return
    }
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

  function handleAddSelectedVariant() {
    const selectedVariantKey = variantSelectionKey(selectedVariant)
    const selectedStockLimit = product.manageStock
      ? (getVariantQuantityLimit(variantOptions, selectedVariant) ?? product.stock)
      : 30
    const canAddSelectedVariant = (product.manageStock ? selectedStockLimit > 0 : true)
      && variantOptions.every((option, index) => Boolean(selectedVariant[index]?.value))

    if (!canAddSelectedVariant) return

    addItem({
      id: `${product.id}:${selectedVariantKey}`,
      variantKey: selectedVariantKey,
      variantSelection: selectedVariant,
      productId: product.id,
      storeId: product.storeId,
      name: product.name,
      price: product.price,
      image: imageSrc,
      storeName: product.store.name,
    })
    setVariantDialogOpen(false)
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
    <>
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
            <Badge className={`absolute ${isOutOfStock ? "top-12" : "top-3"} left-3 bg-destructive hover:bg-destructive text-primary-foreground font-bold px-3 py-1.5 rounded-full shadow-lg text-xs`}>
              -{discount}%
            </Badge>
          )}

          {isOutOfStock && (
            <Badge className="absolute top-3 left-3 bg-foreground/85 text-background hover:bg-foreground/85 font-bold px-3 py-1.5 rounded-full shadow-lg text-xs">
              Agotado
            </Badge>
          )}

          <button
            type="button"
            onClick={handleLike}
            onPointerEnter={() => setIsFavoriteHovered(true)}
            onPointerLeave={() => setIsFavoriteHovered(false)}
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
            <InteractiveMorphIcon
              icon={MorphHeart}
              hoverIcon={MorphHeartPlus}
              hovered={isFavoriteHovered}
              activeIcon={MorphHeartPlus}
              className={`h-4 w-4 transition-transform ${isLiked ? "fill-current scale-110" : ""}`}
              spring="snappy"
              reducedMotion="never"
            />
          </button>

          <div
            className={`absolute bottom-0 left-0 right-0 hidden p-4 transition-all duration-300 lg:block ${
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              onClick={handleAddToCart}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground shadow-xl btn-shine"
              disabled={!canAdd}
            >
              <InteractiveMorphIcon icon={MorphShoppingCart} className="mr-2 h-4 w-4" spring="snappy" reducedMotion="never" />
              {variantOptions.length > 0 ? "Elegir variante" : "Agregar al carrito"}
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
              aria-label={variantOptions.length > 0 ? "Elegir variante" : "Agregar al carrito"}
              disabled={!canAdd}
            >
              <InteractiveMorphIcon icon={MorphShoppingCart} className="h-4 w-4" spring="snappy" reducedMotion="never" />
            </Button>
          </div>
        </div>
      </div>
    </Link>

    <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Elige una variante de {product.name}</DialogTitle>
          <DialogDescription>Selecciona la opción que quieres comprar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {variantOptions.map((option, index) => (
            <label key={option.name} className="block space-y-1.5 text-sm font-medium">
              <span>{option.name}</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-normal"
                value={selectedVariant[index]?.value ?? option.values[0]?.value ?? ""}
                onChange={(event) => {
                  const value = event.target.value
                  setSelectedVariant((current) => {
                    const next = [...current]
                    next[index] = { name: option.name, value }
                    return next
                  })
                }}
              >
                {option.values.map((optionValue) => (
                  <option key={optionValue.value} value={optionValue.value}>
                    {optionValue.value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setVariantDialogOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleAddSelectedVariant}>
            Agregar al carrito
          </Button>
          <Button type="button" onClick={() => router.push(href)}>
            Ver producto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}
