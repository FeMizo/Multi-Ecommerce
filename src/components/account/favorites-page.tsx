"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { removeFavorite, readFavoritesFromStorage, subscribeToFavorites, type FavoriteProduct } from "@/lib/favorites"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"

const EMPTY_FAVORITES: readonly FavoriteProduct[] = []

export function FavoritesPage() {
  const favorites = useSyncExternalStore(subscribeToFavorites, readFavoritesFromStorage, () => EMPTY_FAVORITES)

  function handleRemove(productId: string) {
    removeFavorite(productId)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Favoritos</h1>
          <p className="text-sm text-muted-foreground">Productos guardados con el corazón.</p>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          {favorites.length} guardados
        </Badge>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold">Aún no guardas productos</p>
          <p className="mt-2 text-sm text-muted-foreground">Toca el corazón en cualquier producto para verlo aquí.</p>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/search">
              <Search className="h-4 w-4" />
              Explorar productos
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((product) => (
            <div key={product.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
              <Link href={product.storeSlug ? `/${product.storeSlug}/${product.slug}` : `/products/${product.slug}`} className="block">
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={product.image || DEFAULT_PRODUCT_IMAGE}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{product.storeName}</p>
                    <Link href={product.storeSlug ? `/${product.storeSlug}/${product.slug}` : `/products/${product.slug}`} className="block">
                      <h2 className="font-semibold leading-snug line-clamp-2">{product.name}</h2>
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full text-destructive hover:text-destructive"
                    onClick={() => handleRemove(product.id)}
                    aria-label={`Quitar ${product.name} de favoritos`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">{formatPrice(product.price)}</p>
                  {product.comparePrice ? (
                    <p className="text-sm text-muted-foreground line-through">{formatPrice(product.comparePrice)}</p>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button asChild className="rounded-full">
                    <Link href={product.storeSlug ? `/${product.storeSlug}/${product.slug}` : `/products/${product.slug}`}>
                      Ver producto
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
