"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { useCartStore } from "@/stores/cart"
import { useState } from "react"

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
  const [isLiked, setIsLiked] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  const href = storeSlug
    ? `/${storeSlug}/${product.slug}`
    : `/products/${product.slug}`

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
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

  function handleLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsLiked(!isLiked)
  }

  return (
    <Link href={href} className="group block">
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
        {/* Image Container */}
        <div className="relative aspect-square bg-muted/50 overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/50 text-sm">
              Sin imagen
            </div>
          )}
          
          {/* Discount Badge */}
          {discount && (
            <Badge className="absolute top-3 left-3 bg-destructive hover:bg-destructive text-destructive-foreground font-semibold px-2.5 py-1 rounded-full shadow-lg">
              -{discount}%
            </Badge>
          )}
          
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`absolute top-3 right-3 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 ${
              isLiked 
                ? 'bg-primary text-primary-foreground scale-110' 
                : 'bg-background/80 backdrop-blur-sm text-foreground hover:bg-background hover:scale-105'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          
          {/* Quick Add Button - Shows on Hover */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Button 
              onClick={handleAddToCart}
              className="w-full h-10 rounded-xl bg-foreground/90 hover:bg-foreground text-background backdrop-blur-sm shadow-lg"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Store Info */}
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {product.store.name}{product.store.city ? ` · ${product.store.city.name}` : ""}
            </span>
          </p>
          
          {/* Product Name */}
          <h3 className="font-medium text-sm line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <p className="font-bold text-lg text-foreground">{formatPrice(product.price)}</p>
              {product.comparePrice && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </p>
              )}
            </div>
            
            {/* Mobile Add Button */}
            <Button 
              size="icon" 
              variant="outline" 
              className="h-9 w-9 shrink-0 rounded-xl border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors lg:hidden" 
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
