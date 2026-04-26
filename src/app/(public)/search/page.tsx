import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

type SearchParams = { q?: string; category?: string; city?: string; min?: string; max?: string; page?: string }

async function searchProducts(params: SearchParams) {
  const page = Number(params.page ?? 1)
  const take = 24
  const skip = (page - 1) * take

  const where: Record<string, unknown> = { status: "ACTIVE" }
  if (params.q) where.name = { contains: params.q, mode: "insensitive" }
  if (params.category) where.category = { slug: params.category }
  if (params.city) where.store = { city: { slug: params.city } }
  if (params.min || params.max) {
    where.price = {
      ...(params.min ? { gte: Number(params.min) } : {}),
      ...(params.max ? { lte: Number(params.max) } : {}),
    }
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { store: { select: { name: true, city: true } }, category: true },
      take,
      skip,
      orderBy: { createdAt: "desc" },
    }),
    db.product.count({ where }),
  ])

  return { products, total, page, pages: Math.ceil(total / take) }
}

async function getCategories() {
  return db.category.findMany({ where: { active: true, parentId: null } })
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const [{ products, total, page, pages }, categories] = await Promise.all([
    searchProducts(params),
    getCategories(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <h3 className="font-semibold mb-3">Categorías</h3>
          <div className="flex flex-col gap-1">
            <Link
              href="/search"
              className={`text-sm px-3 py-1.5 rounded-md hover:bg-accent ${!params.category ? "bg-accent font-medium" : ""}`}
            >
              Todas
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.slug}${params.q ? `&q=${params.q}` : ""}`}
                className={`text-sm px-3 py-1.5 rounded-md hover:bg-accent ${params.category === cat.slug ? "bg-accent font-medium" : ""}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">
                {params.q ? `Resultados para "${params.q}"` : "Todos los productos"}
              </h1>
              <p className="text-sm text-muted-foreground">{total} productos</p>
            </div>
            {params.category && (
              <Link href={`/search${params.q ? `?q=${params.q}` : ""}`}>
                <Badge variant="secondary" className="cursor-pointer">
                  {params.category} ×
                </Badge>
              </Link>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No se encontraron productos
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/search?${new URLSearchParams({ ...params, page: String(p) })}`}
                      className={`h-9 w-9 flex items-center justify-center rounded-md border text-sm ${
                        p === page ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
