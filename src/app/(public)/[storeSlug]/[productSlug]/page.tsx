import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Star, Package, Shield, MapPin } from "lucide-react"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AddToCartButton } from "@/components/products/add-to-cart-button"

async function getProduct(storeSlug: string, productSlug: string) {
  return db.product.findFirst({
    where: {
      slug: productSlug,
      status: "ACTIVE",
      deletedAt: null,
      store: { slug: storeSlug, isActive: true, deletedAt: null },
    },
    include: {
      store: { include: { city: true } },
      category: true,
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  })
}

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productSlug: string }>
}) {
  const { storeSlug, productSlug } = await params
  const product = await getProduct(storeSlug, productSlug)
  if (!product) notFound()

  const avgRating = product.reviews.length
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/${storeSlug}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a {product.store.name}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Sin imagen
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <Badge variant="secondary">{product.category.name}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold mt-2 text-primary">
              {product.name}
            </h1>

            {product._count.reviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= avgRating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product._count.reviews} reseñas)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </span>
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

          <div className="rounded-xl border p-4">
            <p className="font-semibold mb-2">Vendedor</p>
            <Link
              href={`/${product.store.slug}`}
              className="flex items-center gap-3 hover:opacity-80"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                {product.store.name[0]}
              </div>
              <div>
                <p className="font-medium">{product.store.name}</p>
                {product.store.city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {product.store.city.name}
                  </p>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Compra protegida · Pago seguro
          </div>

          {product.description && (
            <div>
              <h3 className="font-semibold text-base mb-1">Descripción</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">
            Reseñas ({product._count.reviews})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                    {review.user.name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.user.name}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
