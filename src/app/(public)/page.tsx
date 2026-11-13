import { plural } from "@/lib/plural"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight as MorphArrowRight } from "lucide"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { CategoryGrid } from "@/components/products/category-grid"
import { DEFAULT_SHOP_BANNER, DEFAULT_SHOP_ICON } from "@/lib/placeholders"
import { buildKeywords } from "@/lib/seo"
import { absoluteUrl } from "@/lib/site-url"
import { VerifiedBadge } from "@/components/public/verified-badge"
import { MorphLink } from "@/components/ui/morph-link"

export const metadata: Metadata = {
  title: { absolute: "AionSite Shop" },
  description: "AionSite Shop es un marketplace local para descubrir productos unicos de tu comunidad y comprar a vendedores locales en Mexico.",
  keywords: buildKeywords("AionSite Shop", ["marketplace mexicano", "productos locales", "comprar en linea"]),
  alternates: { canonical: "/" },
  openGraph: {
    title: "AionSite Shop",
    description: "AionSite Shop es un marketplace local para descubrir productos unicos de tu comunidad y comprar a vendedores locales en Mexico.",
    url: "/",
    siteName: "AionSite Shop",
    locale: "es_MX",
    type: "website",
    images: [absoluteUrl(DEFAULT_SHOP_BANNER)],
  },
  twitter: {
    card: "summary_large_image",
    title: "AionSite Shop",
    description: "AionSite Shop es un marketplace local para descubrir productos unicos de tu comunidad y comprar a vendedores locales en Mexico.",
    images: [absoluteUrl(DEFAULT_SHOP_BANNER)],
  },
}

async function getFeaturedProducts() {
  return db.product.findMany({
    where: {
      status: "ACTIVE",
      store: { isActive: true, deletedAt: null },
    },
    include: { store: { select: { name: true, slug: true, primaryColor: true } }, category: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  })
}

async function getCategories() {
  return db.category.findMany({
    where: { active: true, parentId: null },
    include: {
      _count: {
        select: {
          products: {
            where: {
              status: "ACTIVE",
              deletedAt: null,
              store: { isActive: true, deletedAt: null },
            },
          },
        },
      },
    },
    take: 8,
  })
}

async function getFeaturedStores() {
  const [stores, productCounts, orders] = await Promise.all([
    db.store.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        featuredPosition: { not: null },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        bannerUrl: true,
        logoUrl: true,
        primaryColor: true,
        isVerified: true,
        featuredPosition: true,
        createdAt: true,
      },
      orderBy: [{ featuredPosition: "asc" }, { createdAt: "desc" }],
    }),
    db.product.groupBy({
      by: ["storeId"],
      where: {
        status: "ACTIVE",
        deletedAt: null,
        store: { isActive: true, deletedAt: null },
      },
      _count: { _all: true },
    }),
    db.order.groupBy({
      by: ["storeId"],
      where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _count: { _all: true },
    }),
  ])

  const productCountMap = new Map(productCounts.map((product) => [product.storeId, product._count._all]))
  const orderCountMap = new Map(orders.map((order) => [order.storeId, order._count._all]))

  return stores
    .filter((store) => (productCountMap.get(store.id) ?? 0) > 0)
    .slice(0, 8)
    .map((store) => ({
      ...store,
      productCount: productCountMap.get(store.id) ?? 0,
      orderCount: orderCountMap.get(store.id) ?? 0,
    }))
}

export default async function HomePage() {
  const [products, categories, stores] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getFeaturedStores(),
  ])
  const visibleCategories = categories.filter((category) => category._count.products > 0)

  return (
    <div className="flex flex-col">
      <section className="border-b border-border/60 bg-secondary/40">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="editorial-title text-4xl leading-tight text-balance md:text-5xl">Compra en tiendas locales.</h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">Descubre productos y elige la tienda donde quieres comprar.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <MorphLink href="/search" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90" icon={MorphArrowRight} iconClassName="h-4 w-4">Explorar catálogo</MorphLink>
              <Link href="/register?role=seller" className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-6 py-3 font-medium transition-colors hover:bg-accent">Abrir mi tienda</Link>
            </div>
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="editorial-title text-4xl md:text-5xl">Productos</h2>
              </div>
              <MorphLink
                href="/search"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                icon={MorphArrowRight}
                iconClassName="h-4 w-4"
              >
                Ver catálogo
              </MorphLink>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}


      {visibleCategories.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="editorial-title text-4xl md:text-5xl">Explora por categoría</h2>
              </div>
              <MorphLink
                href="/categories"
                className="hidden items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80 sm:flex"
                icon={MorphArrowRight}
                iconClassName="h-4 w-4"
              >
                Ver todas
              </MorphLink>
            </div>
            <CategoryGrid categories={visibleCategories} />
          </div>
        </section>
      )}

      {stores.length > 0 && (
        <section className="bg-muted/35 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="editorial-title text-4xl md:text-5xl">Tiendas destacadas</h2>
              </div>
              <MorphLink
                href="/stores"
                className="hidden items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80 sm:flex"
                icon={MorphArrowRight}
                iconClassName="h-4 w-4"
              >
                Ver todas
              </MorphLink>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {stores.map((store, index) => (
                <Link
                  key={store.id}
                  href={`/${store.slug}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-border/60 bg-background shadow-sm transition-transform duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative h-32 overflow-hidden">
                    <Image
                      src={store.bannerUrl || DEFAULT_SHOP_BANNER}
                      alt={store.bannerUrl ? "" : `Banner genérico de ${store.name}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                    <div className="absolute right-3 top-3">
                      {store.isVerified ? <VerifiedBadge compact /> : null}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative -mt-10 h-16 w-16 overflow-hidden rounded-2xl border-4 border-background bg-background shadow-lg">
                        <Image
                          src={store.logoUrl || DEFAULT_SHOP_ICON}
                          alt={store.logoUrl ? store.name : `Icono genérico de ${store.name}`}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="truncate text-base font-semibold">{store.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{plural(store.productCount, "producto")} · {plural(store.orderCount, "venta")}</p>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}


      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl bg-foreground px-6 py-8 text-background md:px-10 md:py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="editorial-title text-3xl md:text-4xl">Tu tienda también tiene un lugar aquí.</h2>
                <p className="mt-3 leading-7 text-background/80">Publica tus productos y administra tu catálogo y pedidos desde tu panel.</p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
                <Link href="/register?role=seller" className="inline-flex min-h-12 items-center justify-center rounded-full bg-background px-6 py-3 font-medium text-foreground transition-colors hover:bg-background/90">Abrir mi tienda</Link>
                <Link href="/plans" className="inline-flex min-h-12 items-center justify-center rounded-full border border-background/40 px-6 py-3 font-medium text-background transition-colors hover:bg-background/10">Ver planes y precios</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
