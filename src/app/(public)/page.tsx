import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Shield, Truck, Star, MapPin, CheckCircle2, Package, Sparkles, Heart, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { CategoryGrid } from "@/components/products/category-grid"

async function getFeaturedProducts() {
  return db.product.findMany({
    where: { status: "ACTIVE", featured: true },
    include: { store: { select: { name: true, city: true } }, category: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  })
}

async function getCategories() {
  return db.category.findMany({
    where: { active: true, parentId: null },
    include: { _count: { select: { products: true } } },
    take: 8,
  })
}

async function getFeaturedStores() {
  return db.store.findMany({
    where: { isActive: true, deletedAt: null },
    include: {
      city: { select: { name: true } },
      _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
    },
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
    take: 8,
  })
}

export default async function HomePage() {
  const [products, categories, stores] = await Promise.all([getFeaturedProducts(), getCategories(), getFeaturedStores()])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-0 hover:bg-primary/15">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Tu marketplace local favorito
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
              Descubre productos únicos de{" "}
              <span className="text-primary relative">
                tu comunidad
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path d="M0,8 Q50,0 100,8 T200,8" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
              Conectamos compradores y vendedores locales. Encuentra productos artesanales, entregas el mismo día y apoya a emprendedores de tu ciudad.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8 text-base rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" asChild>
                <Link href="/search">
                  Explorar tiendas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base rounded-full border-2 hover:bg-accent" asChild>
                <Link href="/register">
                  Abrir mi tienda
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto mt-16 pt-8 border-t border-border/50">
            {[
              { value: "500+", label: "Tiendas activas" },
              { value: "10K+", label: "Productos únicos" },
              { value: "50+", label: "Ciudades" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20 bg-card border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">¿Por qué elegirnos?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Una experiencia de compra diseñada para ti y tu comunidad</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { 
                icon: Clock, 
                title: "Entrega el mismo día", 
                desc: "Recibe tus productos en horas, no días. Conectamos con vendedores cercanos.",
                color: "bg-primary/10 text-primary"
              },
              { 
                icon: Shield, 
                title: "Compra protegida", 
                desc: "Tu dinero está seguro hasta que confirmes la recepción de tu pedido.",
                color: "bg-success/10 text-success"
              },
              { 
                icon: Heart, 
                title: "Apoya lo local", 
                desc: "Cada compra impulsa a emprendedores y artesanos de tu comunidad.",
                color: "bg-primary/10 text-primary"
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group p-6 md:p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center mb-5`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Explora por categorías</h2>
                <p className="text-muted-foreground">Encuentra exactamente lo que buscas</p>
              </div>
              <Link href="/search" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <CategoryGrid categories={categories} />
            <Link href="/search" className="flex sm:hidden items-center justify-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-6">
              Ver todas las categorías
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Featured Stores */}
      {stores.length > 0 && (
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-0">
                  <Star className="w-3 h-3 mr-1" />
                  Destacadas
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Tiendas populares</h2>
                <p className="text-muted-foreground">Descubre las favoritas de la comunidad</p>
              </div>
              <Link href="/stores" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/${store.slug}`}
                  className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="relative h-24 md:h-28 bg-muted overflow-hidden">
                    {store.bannerUrl ? (
                      <Image src={store.bannerUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3 -mt-10 mb-3">
                      <div
                        className="h-14 w-14 rounded-xl border-[3px] border-card bg-card flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden shadow-md"
                        style={{ color: store.primaryColor ?? undefined }}
                      >
                        {store.logoUrl ? (
                          <Image src={store.logoUrl} alt={store.name} width={56} height={56} className="object-cover" />
                        ) : store.name[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-semibold text-sm truncate">{store.name}</span>
                      {store.isVerified && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {store.city ? (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{store.city.name}</span>
                      ) : <span />}
                      <span className="flex items-center gap-1"><Package className="h-3 w-3" />{store._count.products}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <Link href="/stores" className="flex sm:hidden items-center justify-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-6">
              Ver todas las tiendas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Lo más nuevo
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Productos destacados</h2>
                <p className="text-muted-foreground">Los más populares de esta semana</p>
              </div>
              <Link href="/search" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            <Link href="/search" className="flex sm:hidden items-center justify-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-6">
              Ver todos los productos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* CTA Vendedor */}
      <section className="py-16 md:py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-12 lg:p-16">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/15 mb-6">
                <Package className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-primary-foreground text-balance">
                ¿Listo para vender tus productos?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto text-balance">
                Únete a cientos de emprendedores que ya venden en nuestra plataforma. Configuración en minutos, sin costos ocultos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base rounded-full" asChild>
                  <Link href="/register">
                    Crear mi tienda gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" className="h-12 px-8 text-base rounded-full text-primary-foreground hover:bg-white/10 hover:text-primary-foreground" asChild>
                  <Link href="/stores">
                    Ver ejemplos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
