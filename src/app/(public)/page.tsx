import Link from "next/link"
import Image from "next/image"
import {
  CheckCircle2,
  Clock3,
  Heart,
  Package,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  BadgeCheck,
} from "lucide-react"
import { ArrowRight as MorphArrowRight } from "lucide"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { CategoryGrid } from "@/components/products/category-grid"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_HOME_HERO_IMAGE, DEFAULT_SHOP_BANNER, DEFAULT_SHOP_ICON } from "@/lib/placeholders"
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
      featured: true,
      store: { isActive: true, deletedAt: null },
    },
    include: { store: { select: { name: true, primaryColor: true } }, category: true },
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

async function getHomeStats() {
  const [storesCount, productsCount, categoriesCount] = await Promise.all([
    db.store.count({ where: { isActive: true, deletedAt: null } }),
    db.product.count({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        store: { isActive: true, deletedAt: null },
      },
    }),
    db.category.count({
      where: {
        active: true,
        parentId: null,
        products: {
          some: {
            status: "ACTIVE",
            deletedAt: null,
            store: { isActive: true, deletedAt: null },
          },
        },
      },
    }),
  ])

  return [
    { value: storesCount, label: "Tiendas activas", icon: Package },
    { value: productsCount, label: "Productos únicos", icon: Heart },
    { value: categoriesCount, label: "Categorías activas", icon: Sparkles },
  ]
}

const highlights = [
  "Compra protegida",
  "Tiendas verificadas",
  "Catálogo local curado",
  "Soporte por WhatsApp",
]

const trustCards = [
  {
    icon: Shield,
    title: "Compra protegida",
    body: "Checkout claro, métodos de pago visibles y confianza antes de comprar.",
  },
  {
    icon: BadgeCheck,
    title: "Vendedores verificados",
    body: "Las tiendas destacadas muestran señales reales de actividad y reputación.",
  },
  {
    icon: Clock3,
    title: "Descubrimiento rápido",
    body: "Busca, filtra y vuelve a navegar sin fricción en móvil o escritorio.",
  },
]

export default async function HomePage() {
  const [products, categories, stores, stats] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getFeaturedStores(),
    getHomeStats(),
  ])
  const visibleCategories = categories.filter((category) => category._count.products > 0)

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 surface-grid opacity-40" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-28 left-0 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-24 right-0 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-8 relative">
          <div className="rounded-full border border-border/60 bg-background/80 px-4 py-2 text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground inline-flex items-center gap-2 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Mercado local premium
          </div>

          <div className="grid gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
            <div className="space-y-7">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">AionSite Shop</p>
                <h1 className="editorial-title max-w-3xl text-5xl leading-[0.9] text-balance md:text-6xl lg:text-[5.6rem]">
                  Compra local con una experiencia que se siente top.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                  Un marketplace curado para descubrir productos, comparar tiendas y comprar con más confianza.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {highlights.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <MorphLink
                  href="/search"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-medium text-primary-foreground btn-shine transition-colors hover:bg-primary/90"
                  icon={MorphArrowRight}
                  iconClassName="h-4 w-4"
                >
                  Explorar catálogo
                </MorphLink>
                <MorphLink
                  href="/register"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-border bg-background px-8 text-base font-medium text-foreground transition-colors hover:bg-accent"
                  icon={MorphArrowRight}
                  iconClassName="h-4 w-4"
                >
                  Abrir mi tienda
                </MorphLink>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur">
                    <stat.icon className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-3xl font-semibold">{new Intl.NumberFormat("es-MX").format(stat.value)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.25rem] bg-primary/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_30px_80px_-35px_rgba(0,0,0,0.45)]">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={DEFAULT_HOME_HERO_IMAGE}
                    alt="AionSite Shop"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                </div>
                <div className="absolute inset-x-5 bottom-5 rounded-3xl border border-white/15 bg-background/85 p-5 backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Confianza</p>
                      <p className="mt-1 text-2xl font-semibold">Tiendas verificadas y catálogo curado</p>
                    </div>
                    <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                      <Shield className="h-7 w-7" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/70">
        <div className="container mx-auto grid gap-6 px-4 py-8 md:grid-cols-3">
          {trustCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="rounded-3xl border border-border/60 bg-background p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {visibleCategories.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-0">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Descubrimiento
                </Badge>
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
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-0">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Prueba social
                </Badge>
                <h2 className="editorial-title text-4xl md:text-5xl">Tiendas que ya se sienten premium</h2>
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
                        <p className="mt-1 text-xs text-muted-foreground">{store.productCount} productos · {store.orderCount} ventas</p>
                      </div>
                    </div>
                    {store.featuredPosition !== null && (
                      <div className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        Posición {store.featuredPosition}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-0">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Selección curada
                </Badge>
                <h2 className="editorial-title text-4xl md:text-5xl">Productos destacados</h2>
              </div>
              <MorphLink
                href="/search"
                className="hidden items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80 sm:flex"
                icon={MorphArrowRight}
                iconClassName="h-4 w-4"
              >
                Ver catálogo completo
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

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-foreground px-8 py-12 text-background md:px-12 md:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,122,23,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_28%)]" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Fase 3</p>
                <h2 className="editorial-title mt-3 text-4xl md:text-5xl">Herramientas y marca para vender mejor.</h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-background/75 md:text-lg">
                  Panel, publicaciones, catálogo y confianza en una sola experiencia. Más claridad para el comprador, más control para el vendedor.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Publicación más fácil",
                  "Promociones visibles",
                  "Confianza y verificación",
                  "Métricas de venta",
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
