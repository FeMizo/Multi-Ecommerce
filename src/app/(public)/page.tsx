import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Shield, Star, MapPin, CheckCircle2, Package, Sparkles, Heart, Clock, Quote, Zap, Gift, TrendingUp } from "lucide-react"
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

const testimonials = [
  {
    name: "Maria Garcia",
    role: "Compradora frecuente",
    avatar: "M",
    content: "Encontre productos artesanales increibles que no conseguia en ningun otro lugar. La entrega fue super rapida!",
    rating: 5,
  },
  {
    name: "Carlos Rodriguez",
    role: "Vendedor desde 2024",
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

const promoItems = [
  "Envio gratis en tu primera compra",
  "Nuevas tiendas cada semana",
  "Soporte 24/7",
  "Compra protegida garantizada",
  "Miles de productos unicos",
]

export default async function HomePage() {
  const [products, categories, stores] = await Promise.all([getFeaturedProducts(), getCategories(), getFeaturedStores()])

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
        
        <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in-up">
              <Badge variant="secondary" className="mb-6 px-5 py-2.5 text-sm font-medium bg-primary/10 text-primary border-0 hover:bg-primary/15 transition-colors">
                <Sparkles className="w-4 h-4 mr-2" />
                Tu marketplace local favorito
              </Badge>
            </div>
            
            <h1 className="animate-fade-in-up delay-100 text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-balance leading-[1.1]">
              Descubre productos{" "}
              <span className="gradient-text">unicos</span>{" "}
              de tu comunidad
            </h1>
            
            <p className="animate-fade-in-up delay-200 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
              Conectamos compradores y vendedores locales. Encuentra productos artesanales, entregas el mismo dia y apoya a emprendedores de tu ciudad.
            </p>
            
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
              <span className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Envio gratis +$50
              </span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="animate-fade-in-up delay-500 grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto mt-20">
            {[
              { value: "500+", label: "Tiendas activas", icon: Package },
              { value: "10K+", label: "Productos unicos", icon: Heart },
              { value: "50+", label: "Ciudades", icon: MapPin },
            ].map((stat, i) => (
              <div key={stat.label} className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/10 transition-colors" />
                <div className="relative p-6 md:p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 text-center hover-lift">
                  <stat.icon className="h-6 w-6 mx-auto mb-3 text-primary" />
                  <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que elegirnos?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Una experiencia de compra disenada para ti y tu comunidad</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { 
                icon: Clock, 
                title: "Entrega express", 
                desc: "Recibe tus productos en horas, no dias. Conectamos con vendedores cercanos a ti.",
                color: "from-primary/20 to-primary/5",
                iconColor: "text-primary"
              },
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
            ].map(({ icon: Icon, title, desc, color, iconColor }, i) => (
              <div key={title} className="group relative hover-lift">
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
      {categories.length > 0 && (
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
              <Link href="/search" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
                Ver todas
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <CategoryGrid categories={categories} />
            <Link href="/search" className="flex sm:hidden items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors mt-8">
              Ver todas las categorias
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Featured Stores */}
      {stores.length > 0 && (
        <section className="py-20 md:py-24 bg-muted/30">
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
                    {store.bannerUrl ? (
                      <Image src={store.bannerUrl} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  </div>
                  <div className="p-4 pt-0">
                    <div className="flex items-start gap-3 -mt-8 mb-3">
                      <div
                        className="z-20 h-16 w-16 rounded-2xl border-4 border-card bg-card flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden shadow-lg group-hover:scale-105 transition-transform"
                        style={{ color: store.primaryColor ?? undefined }}
                      >
                        {store.logoUrl ? (
                          <Image src={store.logoUrl} alt={store.name} width={64} height={64} className="object-cover" />
                        ) : store.name[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-base truncate group-hover:text-primary transition-colors">{store.name}</span>
                      {store.isVerified && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {store.city ? (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{store.city.name}</span>
                      ) : <span />}
                      <span className="flex items-center gap-1 font-medium"><Package className="h-3 w-3" />{store._count.products} productos</span>
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
              <div key={i} className="group relative hover-lift">
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
                Unete a cientos de emprendedores que ya venden en nuestra plataforma. Configuracion en minutos, sin costos ocultos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-14 px-10 text-base rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 btn-shine" asChild>
                  <Link href="/register">
                    Crear mi tienda gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full border-2 border-background/20 text-background hover:bg-background/10 hover:border-background/30" asChild>
                  <Link href="/stores">
                    Ver ejemplos
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
