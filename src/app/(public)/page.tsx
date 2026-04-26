import Link from "next/link"
import { ArrowRight, Shield, Truck, Star, MapPin } from "lucide-react"
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

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()])

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4">Tu marketplace local</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Compra y vende en
            <span className="text-primary"> tu ciudad</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Conectamos compradores y vendedores locales. Entrega rápida, precios justos, sin intermediarios.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/search">
                Explorar productos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Vender aquí</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: "Entrega el mismo día", desc: "Conectamos con vendedores de tu zona para entregas rápidas" },
            { icon: Shield, title: "Compra protegida", desc: "Tu dinero está seguro hasta que recibas tu pedido" },
            { icon: Star, title: "Vendedores verificados", desc: "Calificaciones reales de la comunidad local" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-6 rounded-xl border bg-card">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Categorías</h2>
            <Link href="/search" className="text-sm text-primary hover:underline">
              Ver todo
            </Link>
          </div>
          <CategoryGrid categories={categories} />
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Productos destacados</h2>
            <Link href="/search" className="text-sm text-primary hover:underline">
              Ver todo
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* CTA Vendedor */}
      <section className="container mx-auto px-4">
        <div className="rounded-2xl bg-primary p-8 md:p-12 text-primary-foreground text-center">
          <MapPin className="h-10 w-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-2">¿Tienes algo para vender?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
            Regístrate como vendedor, sube tus productos en minutos y llega a clientes de tu ciudad.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              Comenzar a vender <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
