import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Shield, Star, CheckCircle2, Package, Sparkles, Heart, Clock, Quote, Zap, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { CategoryGrid } from "@/components/products/category-grid"
import { DEFAULT_SHOP_BANNER, DEFAULT_SHOP_ICON } from "@/lib/placeholders"
import { buildKeywords } from "@/lib/seo"
import { absoluteUrl } from "@/lib/site-url"
import { VerifiedBadge } from "@/components/public/verified-badge"
import type { Metadata } from "next"

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
    db.store.count({
      where: { isActive: true, deletedAt: null },
    }),
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
    { value: categoriesCount, label: "Categorias activas", icon: Sparkles },
  ]
}

const testimonials = [
  {
    name: "Cliente anónima",
    role: "Compradora frecuente",
    avatar: "M",
    content: "Encontre productos artesanales increibles que no conseguia en ningun otro lugar. La entrega fue super rapida!",
    rating: 5,
  },
  {
    name: "Tienda local",
    role: "Desde 2024",
    avatar: "C",
    content: "Abri mi tienda en minutos y ya tengo clientes recurrentes. La plataforma es muy facil de usar.",
    rating: 5,
  },
  {
    name: "Ana Martinez",
    role: "Compradora verificada",
    avatar: "A",
    content: "Me encanta poder apoyar a emprendedores locales. Los productos son de excelente calidad.",
    rating: 5,
  },
]

const SHOW_TESTIMONIALS = false

const promoItems = [
  "Nuevas tiendas locales",
  "Soporte",
  "Compra protegida garantizada",
  "Miles de productos unicos",
  "Apoyo local a emprendedores",
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
      {/* Promo Banner */}
      <div className="bg-foreground text-background py-2.5 overflow-hidden">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap">
          {[...promoItems, ...promoItems].map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-sm font-medium">
              <Zap className="h-3.5 w-3.5 text-primary" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl animate-pulse-soft delay-500" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl animate-float" />
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-20 lg:pt-15 lg:pb-25 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in-up">
              <Badge variant="secondary" className="mb-6 px-5 py-2.5 text-sm font-medium bg-primary/10 text-primary border-0 hover:bg-primary/15 transition-colors">
                <Sparkles className="w-4 h-4 mr-2" />
                AionSite Shop
              </Badge>
            </div>
            <p className="animate-fade-in-up delay-50 mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Marketplace local en Ciudad del Carmen
            </p>
            
            <h1 className="animate-fade-in-up delay-100 text-4xl md:text-5xl lg:text-[4rem] font-bold tracking-tight mb-6 text-balance leading-[1.1]">
              AionSite Shop
              <br />
              Marketplace local para comprar y vender
              <br />
              <span className="gradient-text">productos de tu comunidad</span>
            </h1>
            
            <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-muted-foreground max-w-5xl mx-auto mb-10 text-balance leading-relaxed">
              AionSite Shop conecta compradores con tiendas locales de Mexico. Encuentra productos artesanales y apoyo directo a emprendedores de tu comunidad.
            </p>

            <div className="animate-fade-in-up delay-250 mx-auto mb-10 max-w-3xl rounded-3xl border border-border/60 bg-background/80 p-6 text-left shadow-sm backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary mb-3">
                Que hace este Sitio Web
              </p>
              <p className="text-base md:text-lg text-foreground leading-relaxed">
                AionSite Shop es una aplicacion web de marketplace local en Mexico. Permite a los compradores descubrir tiendas locales,
                comprar productos, y permite a los vendedores abrir su tienda y administrar su catalogo y ventas.
              </p>
            </div>
            
            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-10 text-base rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all btn-shine" asChild>
                <Link href="/search">
                  Explorar tiendas
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full border-2 hover:bg-accent hover:scale-[1.02] transition-all" asChild>
                <Link href="/register">
                  Abrir mi tienda
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-in-up delay-400 flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-success" />
                Compra protegida
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Entrega el mismo dia
              </span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="animate-fade-in-up delay-500 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto mt-20">
            {stats.map((stat) => (
              <div key={stat.label} className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/10 transition-colors" />
                <div className="relative p-6 md:p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 text-center hover-lift">
                  <stat.icon className="h-6 w-6 mx-auto mb-3 text-primary" />
                  <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                    {new Intl.NumberFormat("es-MX").format(stat.value)}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-0">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
              Ventajas
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por qué elegirnos?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Una experiencia de compra diseñada para ti y tu comunidad</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {[
              { 
                icon: Shield, 
                title: "Compra protegida", 
                desc: "Tu dinero esta seguro hasta que confirmes la recepcion de tu pedido.",
                color: "from-success/20 to-success/5",
                iconColor: "text-success"
              },
              { 
                icon: Heart, 
                title: "Apoya lo local", 
                desc: "Cada compra impulsa a emprendedores y artesanos de tu comunidad.",
                color: "from-primary/20 to-primary/5",
                iconColor: "text-primary"
              },
            ].map(({ icon: Icon, title, desc, color, iconColor }) => (
              <div key={title} className="group relative hover-lift rounded-3xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative p-8 md:p-10 rounded-3xl bg-background border border-border/50 group-hover:border-primary/20 transition-all duration-300 h-full">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6`}>
                    <Icon className={`h-7 w-7 ${iconColor}`} />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {visibleCategories.length > 0 && (
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Categorias
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Explora por categoria</h2>
                <p className="text-muted-foreground text-lg">Encuentra exactamente lo que buscas</p>
              </div>
              <Link href="/categories" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
                Ver todas
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <CategoryGrid categories={visibleCategories} />
            <Link href="/categories" className="flex sm:hidden items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mt-8">
              Ver todas las categorias
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Featured Stores */}
      {stores.length > 0 && (
        <section className="py-20 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-0">
                  <Star className="w-3 h-3 mr-1 fill-primary" />
                  Destacadas
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Tiendas populares</h2>
                <p className="text-muted-foreground text-lg">Descubre las favoritas de la comunidad</p>
              </div>
              <Link href="/stores" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
                Ver todas
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {stores.map((store, i) => (
                <Link
                  key={store.id}
                  href={`/${store.slug}`}
                  className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover-lift"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="relative h-28 md:h-32 bg-muted overflow-hidden">
                    <Image
                      src={store.bannerUrl || DEFAULT_SHOP_BANNER}
                      alt={store.bannerUrl ? "" : `Banner genérico de ${store.name}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  </div>
                  <div className="p-4 pt-0">
                    <div className="flex items-start gap-3 -mt-8 mb-3">
                      <div
                        className="z-20 h-16 w-16 rounded-2xl border-4 border-card bg-card flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden shadow-lg group-hover:scale-105 transition-transform"
                        style={{ color: store.primaryColor ?? undefined }}
                      >
                        <Image
                          src={store.logoUrl || DEFAULT_SHOP_ICON}
                          alt={store.logoUrl ? store.name : `Icono genérico de ${store.name}`}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-base truncate group-hover:text-primary transition-colors">{store.name}</span>
                    {store.isVerified && <VerifiedBadge compact className="shrink-0" />}
                    {store.featuredPosition !== null && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        Pos. {store.featuredPosition}
                      </Badge>
                    )}
                  </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium"><Package className="h-3 w-3" />{store.productCount} productos</span>
                      <span className="text-right font-medium">{store.orderCount} ventas</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <Link href="/stores" className="flex sm:hidden items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mt-8">
              Ver todas las tiendas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {SHOW_TESTIMONIALS && (
      <section className="py-20 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-0">
              <Quote className="w-3.5 h-3.5 mr-1.5" />
              Testimonios
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros usuarios</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Miles de personas ya confian en nosotros</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="group relative hover-lift rounded-3xl">
                <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-8 rounded-3xl bg-background border border-border/50 group-hover:border-primary/20 transition-all h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-foreground/90 leading-relaxed flex-1 mb-6">{`"${testimonial.content}"`}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Lo mas nuevo
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Productos destacados</h2>
                <p className="text-muted-foreground text-lg">Los mas populares de esta semana</p>
              </div>
              <Link href="/search" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
                Ver todos
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <Link href="/search" className="flex sm:hidden items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mt-8">
              Ver todos los productos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* CTA Vendedor */}
      <section className="py-20 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-foreground p-10 md:p-16 lg:p-20">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-primary mb-8">
                <Package className="h-10 w-10 text-primary-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-background text-balance leading-tight">
                Listo para vender tus productos?
              </h2>
              <p className="text-background/70 mb-10 max-w-lg mx-auto text-lg text-balance">
                Unete a cientos de emprendedores que ya venden en nuestra plataforma. Configuración en minutos, sin costos ocultos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-14 px-10 text-base rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 btn-shine" asChild>
                  <Link href="/register">
                    Crear mi tienda gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" className="h-14 px-10 text-base rounded-full border-2 border-background/20 bg-transparent text-background hover:bg-background/10 hover:border-background/30" asChild>
                  <Link href="/stores">
                    Ver tiendas activas
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-background/60">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Sin comisiones ocultas
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Soporte personalizado
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Panel de control completo
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
