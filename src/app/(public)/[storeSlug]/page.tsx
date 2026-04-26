import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { MapPin, CheckCircle2, Package } from "lucide-react"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
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
    <div className="pb-16">
      {/* Banner */}
      <div className="relative h-40 md:h-56 bg-muted overflow-hidden">
        {store.bannerUrl ? (
          <Image src={store.bannerUrl} alt="" fill className="object-cover" priority />
        ) : (
          <div
            className="w-full h-full"
            style={{ backgroundColor: store.primaryColor ?? "#000000", opacity: 0.15 }}
          />
        )}
      </div>

      {/* Store header */}
      <div className="container mx-auto px-4">
        <div className="flex items-end gap-4 -mt-10 mb-6 relative z-10">
          <div
            className="h-20 w-20 rounded-2xl border-4 border-background bg-card flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden shadow-sm"
            style={{ color: store.primaryColor ?? undefined }}
          >
            {store.logoUrl ? (
              <Image src={store.logoUrl} alt={store.name} width={80} height={80} className="object-cover" />
            ) : (
              store.name[0].toUpperCase()
            )}
          </div>
          <div className="pb-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold truncate">{store.name}</h1>
              {store.isVerified && (
                <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" aria-label="Tienda verificada" />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {store.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {store.city.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {store._count.products} productos
              </span>
            </div>
          </div>
        </div>

        {store.description && (
          <p className="text-sm text-muted-foreground max-w-2xl mb-6">{store.description}</p>
        )}

        <Separator className="mb-6" />

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            <Link
              href={`/${storeSlug}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                !category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent border-input"
              }`}
            >
              Todos
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${storeSlug}?category=${cat.slug}`}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  category === cat.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-accent border-input"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Products */}
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-40" />
            <p className="font-medium">
              {category ? "No hay productos en esta categoría" : "Esta tienda aún no tiene productos"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
              ))}
            </div>

            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
                  const params = new URLSearchParams()
                  if (category) params.set("category", category)
                  if (p > 1) params.set("page", String(p))
                  return (
                    <Link
                      key={p}
                      href={`/${storeSlug}${params.size ? `?${params}` : ""}`}
                      className={`h-9 w-9 flex items-center justify-center rounded-md border text-sm ${
                        p === currentPage
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
