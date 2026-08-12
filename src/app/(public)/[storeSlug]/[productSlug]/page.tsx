import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, CheckCircle2, Package, Shield, Star } from "lucide-react"
import type { Metadata } from "next"
import { cache } from "react"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AddToCartButton } from "@/components/products/add-to-cart-button"
import { ReviewForm } from "@/components/products/review-form"
import { auth } from "@/lib/auth"
import { DEFAULT_PRODUCT_IMAGE, DEFAULT_SHOP_ICON } from "@/lib/placeholders"
import { buildKeywords } from "@/lib/seo"
import { breadcrumbJsonLd, jsonLdScript, productJsonLd } from "@/lib/seo-jsonld"
import { siteUrl } from "@/lib/site-url"
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods"

const getProduct = cache(async (storeSlug: string, productSlug: string) => {
  return db.product.findFirst({
    where: {
      slug: productSlug,
      status: "ACTIVE",
      deletedAt: null,
      store: { slug: storeSlug, isActive: true, deletedAt: null },
    },
    include: {
      store: { include: { city: { select: { name: true, state: true } } } },
      category: true,
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  })
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; productSlug: string }>
}): Promise<Metadata> {
  const { storeSlug, productSlug } = await params
  const product = await getProduct(storeSlug, productSlug)
  if (!product) return { title: "Producto no encontrado" }

  const location = product.store.city ? [product.store.city.name, product.store.city.state].filter(Boolean).join(", ") : ""
  const description = product.description
    ?? `${product.name} de ${product.category.name} en ${product.store.name}${location ? `, ${location}` : ""}. Disponible en AionSite Shop.`
  const canonical = `/${product.store.slug}/${product.slug}`
  const primaryImage = product.images[0] || DEFAULT_PRODUCT_IMAGE
  const imageUrl = /^https?:\/\//i.test(primaryImage) ? primaryImage : `${siteUrl}${primaryImage.startsWith("/") ? primaryImage : `/${primaryImage}`}`

  return {
    title: `${product.name} | ${product.store.name}`,
    description,
    keywords: buildKeywords(product.name, [product.category.name, product.store.name, "producto local", "tienda online"]),
    alternates: { canonical },
    openGraph: {
      title: `${product.name} | ${product.store.name}`,
      description,
      url: canonical,
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${product.store.name}`,
      description,
      images: [imageUrl],
    },
  }
}

export default async function StoreProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productSlug: string }>
}) {
  const { storeSlug, productSlug } = await params
  const session = await auth()
  const product = await getProduct(storeSlug, productSlug)
  if (!product) notFound()

  const [ratingAggregate, deliveredPurchase] = await Promise.all([
    db.review.aggregate({ where: { productId: product.id }, _avg: { rating: true } }),
    session?.user.id
      ? db.orderItem.findFirst({
          where: { productId: product.id, order: { customerId: session.user.id, status: "DELIVERED", deletedAt: null } },
          select: { id: true },
        })
      : null,
  ])

  const avgRating = ratingAggregate._avg.rating ?? 0
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null
  const stockLabel = product.manageStock
    ? (product.stock > 0 ? `${product.stock} disponibles` : "Sin stock")
    : "Sin control de stock"
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Inicio", url: "https://shop.aionsite.com.mx" },
    { name: product.store.name, url: `https://shop.aionsite.com.mx/${product.store.slug}` },
    { name: product.name, url: `https://shop.aionsite.com.mx/${product.store.slug}/${product.slug}` },
  ])
  const availability = product.manageStock && product.stock <= 0 ? "OutOfStock" : "InStock"

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 surface-grid opacity-35" />
      <div className="container mx-auto px-4 py-8 relative">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(
              productJsonLd({
                name: product.name,
                description: product.description ?? `${product.name} de ${product.category.name} en ${product.store.name}.`,
                images: product.images.length > 0 ? product.images : [DEFAULT_PRODUCT_IMAGE],
                sku: product.sku ?? null,
                price: product.price,
                availability,
                url: `https://shop.aionsite.com.mx/${product.store.slug}/${product.slug}`,
                categoryName: product.category.name,
                storeName: product.store.name,
                storeUrl: `https://shop.aionsite.com.mx/${product.store.slug}`,
              }),
            ),
          }}
        />

        <Link
          href={`/${storeSlug}`}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a {product.store.name}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm">
              <div className="relative aspect-square">
                <Image
                  src={product.images[0] || DEFAULT_PRODUCT_IMAGE}
                  alt={product.images[0] ? product.name : `Imagen genérica de ${product.name}`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.slice(1, 5).map((img, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-card">
                    <Image src={img} alt={`${product.name} ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5 rounded-[2rem] border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{product.category.name}</Badge>
              {product.store.isVerified && (
                <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verificada
                </Badge>
              )}
            </div>

            <div>
              <h1 className="editorial-title text-4xl md:text-5xl">{product.name}</h1>
              {product._count.reviews > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= avgRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span>({product._count.reviews} reseñas)</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <span className="text-4xl font-semibold">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
                  <Badge className="rounded-full bg-primary text-primary-foreground">-{discount}%</Badge>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{stockLabel}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Compra protegida · Pago seguro
              </div>
            </div>

            <AddToCartButton product={product} />

            <div className="rounded-3xl border border-border/60 bg-muted/30 p-4">
              <p className="text-sm font-semibold">Vendedor</p>
              <Link href={`/${product.store.slug}`} className="mt-3 flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <Image
                    src={product.store.logoUrl || DEFAULT_SHOP_ICON}
                    alt={product.store.logoUrl ? product.store.name : `Icono genérico de ${product.store.name}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="truncate">{product.store.name}</span>
                    {product.store.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Verificada</span>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.store.stripeOnboarded && `${PAYMENT_METHOD_LABELS.STRIPE} disponible`}
                    {product.store.cashOnDeliveryEnabled && ` · ${PAYMENT_METHOD_LABELS.CASH_ON_DELIVERY} disponible`}
                    {product.store.transferEnabled && ` · ${PAYMENT_METHOD_LABELS.TRANSFER} disponible`}
                  </p>
                </div>
              </Link>
            </div>

            {product.description && (
              <div className="rounded-3xl border border-border/60 bg-card p-5">
                <h2 className="text-lg font-semibold">Descripción</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{product.description}</p>
              </div>
            )}

            {session?.user && deliveredPurchase ? (
              <div className="rounded-3xl border border-border/60 bg-card p-5">
                <ReviewForm productId={product.id} />
              </div>
            ) : session?.user ? (
              <div className="rounded-3xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
                Podrás dejar una reseña cuando tu pedido haya sido entregado.
              </div>
            ) : (
              <div className="rounded-3xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
                Inicia sesión para dejar una reseña.
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          {product.reviews.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="editorial-title text-3xl md:text-4xl">Reseñas</h2>
                <span className="text-sm text-muted-foreground">{product._count.reviews} opiniones</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {product.reviews.map((review) => (
                  <div key={review.id} className="rounded-3xl border border-border/60 bg-background p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {review.user.name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{review.user.name}</p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="text-sm leading-7 text-muted-foreground">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Separator className="my-10" />
      </div>
    </div>
  )
}
