import Link from "next/link"
import { ArrowRight, Tag } from "lucide-react"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ofertas",
  description: "Productos en oferta disponibles en AionSite Shop.",
  alternates: { canonical: "/offers" },
}

export default async function OffersPage() {
  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      comparePrice: { not: null },
    },
    include: { store: { select: { name: true, slug: true, city: true, primaryColor: true } }, category: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  })

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-0">
        <Tag className="w-3 h-3 mr-1" />
        Ofertas
      </Badge>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">Productos en oferta</h1>
      <p className="text-muted-foreground text-lg mb-10">Productos con precio de comparacion activo.</p>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <h2 className="font-semibold mb-2">No hay ofertas activas</h2>
          <p className="text-muted-foreground mb-6">Vuelve pronto o explora todos los productos disponibles.</p>
          <Link href="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
            Ver productos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
