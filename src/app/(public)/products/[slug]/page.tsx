import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, Package, Shield } from "lucide-react"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AddToCartButton } from "@/components/products/add-to-cart-button"

export const dynamic = "force-dynamic"

async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      seller: { include: { city: true, user: { select: { name: true } } } },
      category: true,
      reviews: { include: { user: { select: { name: true, image: true } } }, take: 10 },
      _count: { select: { reviews: true } },
    },
  })
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const avgRating = product.reviews.length
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            {product.images[0] ? (
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sin imagen</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image src={img} alt={`${product.name} ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <Link href={`/search?category=${product.category.slug}`}>
              <Badge variant="secondary">{product.category.name}</Badge>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold mt-2">{product.name}</h1>

            {product._count.reviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= avgRating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product._count.reviews} reseñas)</span>
              </div>
            )}
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
                <Badge className="bg-red-500 hover:bg-red-500">-{discount}%</Badge>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}</span>
          </div>

          <AddToCartButton product={product} />

          <Separator />

          {/* Seller info */}
          <div className="rounded-xl border p-4 space-y-2">
            <p className="font-semibold">Vendedor</p>
            <Link href={`/sellers/${product.seller.id}`} className="flex items-center gap-3 hover:opacity-80">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {product.seller.businessName[0]}
              </div>
              <div>
                <p className="font-medium">{product.seller.businessName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {product.seller.city.name}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Compra protegida · Pago seguro
          </div>

          {product.description && (
            <div className="prose prose-sm max-w-none">
              <h3 className="font-semibold text-base">Descripción</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">Reseñas ({product._count.reviews})</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {review.user.name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.user.name}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
