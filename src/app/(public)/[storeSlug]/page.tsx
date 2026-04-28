import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { MapPin, CheckCircle2, Package, Clock, Star, ChevronLeft, ChevronRight, Share2, Heart } from "lucide-react"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ProductCard } from "@/components/products/product-card"

type Params = { storeSlug: string }
type SearchParams = { category?: string; page?: string }

async function getStore(slug: string) {
  return db.store.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: {
      city: { select: { name: true } },
      _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
    },
  })
}

async function getStoreProducts(storeId: string, categorySlug?: string, page = 1) {
  const take = 24
  const skip = (page - 1) * take
  const where = {
    storeId,
    status: "ACTIVE" as const,
    deletedAt: null,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
  }
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { store: { select: { name: true, slug: true, city: true } }, category: true },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.product.count({ where }),
  ])
  return { products, total, pages: Math.ceil(total / take) }
}

async function getStoreCategories(storeId: string) {
  const products = await db.product.findMany({
    where: { storeId, status: "ACTIVE", deletedAt: null },
    select: { category: { select: { id: true, name: true, slug: true } } },
    distinct: ["categoryId"],
  })
  return products.map((p) => p.category)
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { storeSlug } = await params
  const { category, page } = await searchParams

  const store = await getStore(storeSlug)
  if (!store) notFound()

  const [{ products, total, pages }, categories] = await Promise.all([
    getStoreProducts(store.id, category, Number(page ?? 1)),
    getStoreCategories(store.id),
  ])

  const currentPage = Number(page ?? 1)

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 lg:h-80 bg-muted overflow-hidden">
        {store.bannerUrl ? (
          <Image 
            src={store.bannerUrl} 
            alt="" 
            fill 
            className="object-cover" 
            priority 
          />
        ) : (
          <div 
            className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5"
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </div>

      {/* Store Header */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-20 md:-mt-24 mb-8">
          <div className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 shadow-xl shadow-primary/5">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Logo */}
              <div
                className="h-24 w-24 md:h-28 md:w-28 rounded-2xl border-4 border-card bg-card flex items-center justify-center text-3xl font-bold shrink-0 overflow-hidden shadow-lg -mt-16 md:-mt-20"
                style={{ color: store.primaryColor ?? undefined }}
              >
                {store.logoUrl ? (
                  <Image src={store.logoUrl} alt={store.name} width={112} height={112} className="object-cover" />
                ) : (
                  store.name[0].toUpperCase()
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold">{store.name}</h1>
                      {store.isVerified && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verificada
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {store.city && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {store.city.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Package className="h-4 w-4" />
                        {store._count.products} productos
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        Entrega rápida
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="hidden md:flex items-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {store.description && (
                  <p className="text-muted-foreground mt-4 max-w-2xl">{store.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="mb-8">
            <p className="text-sm font-medium text-muted-foreground mb-3">Categorías</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <Link
                href={`/${storeSlug}`}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  !category
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "bg-card hover:bg-accent border-border/50 hover:border-primary/30"
                }`}
              >
                Todos
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${storeSlug}?category=${cat.slug}`}
                  className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                    category === cat.slug
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-card hover:bg-accent border-border/50 hover:border-primary/30"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <Package className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {category ? "No hay productos en esta categoría" : "Esta tienda aún no tiene productos"}
            </h3>
            <p className="text-muted-foreground">
              Vuelve pronto para ver las novedades
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{products.length}</span> de{" "}
                <span className="font-medium text-foreground">{total}</span> productos
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 pb-8">
                {currentPage > 1 && (
                  <Link
                    href={`/${storeSlug}?${new URLSearchParams({
                      ...(category ? { category } : {}),
                      page: String(currentPage - 1),
                    })}`}
                    className="h-10 w-10 flex items-center justify-center rounded-full border border-border/50 hover:bg-accent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                )}
                
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
                  const params = new URLSearchParams()
                  if (category) params.set("category", category)
                  if (p > 1) params.set("page", String(p))
                  return (
                    <Link
                      key={p}
                      href={`/${storeSlug}${params.size ? `?${params}` : ""}`}
                      className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${
                        p === currentPage
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "border border-border/50 hover:bg-accent"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                })}
                
                {currentPage < pages && (
                  <Link
                    href={`/${storeSlug}?${new URLSearchParams({
                      ...(category ? { category } : {}),
                      page: String(currentPage + 1),
                    })}`}
                    className="h-10 w-10 flex items-center justify-center rounded-full border border-border/50 hover:bg-accent transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
