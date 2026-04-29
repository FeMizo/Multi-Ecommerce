import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { Badge } from "@/components/ui/badge"
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
      include: { store: { select: { name: true, city: true, primaryColor: true } }, category: true },
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

async function getCities() {
  return db.city.findMany({ where: { active: true }, select: { name: true, slug: true }, orderBy: { name: "asc" } })
}

function buildUrl(params: SearchParams) {
  const p = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ) as Record<string, string>
  const qs = new URLSearchParams(p).toString()
  return `/search${qs ? `?${qs}` : ""}`
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const [{ products, total, page, pages }, categories, cities] = await Promise.all([
    searchProducts(params),
    getCategories(),
    getCities(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0 space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Categorías</h3>
            <div className="flex flex-col gap-1">
              <Link
                href={buildUrl({ ...params, category: undefined, page: undefined })}
                className={`text-sm px-3 py-1.5 rounded-md hover:bg-accent ${!params.category ? "bg-accent font-medium" : ""}`}
              >
                Todas
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildUrl({ ...params, category: cat.slug, page: undefined })}
                  className={`text-sm px-3 py-1.5 rounded-md hover:bg-accent ${params.category === cat.slug ? "bg-accent font-medium" : ""}`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {cities.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Ciudad</h3>
              <div className="flex flex-col gap-1">
                <Link
                  href={buildUrl({ ...params, city: undefined, page: undefined })}
                  className={`text-sm px-3 py-1.5 rounded-md hover:bg-accent ${!params.city ? "bg-accent font-medium" : ""}`}
                >
                  Todas
                </Link>
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    href={buildUrl({ ...params, city: c.slug, page: undefined })}
                    className={`text-sm px-3 py-1.5 rounded-md hover:bg-accent ${params.city === c.slug ? "bg-accent font-medium" : ""}`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>

        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-xl font-bold">
              {params.q ? `Resultados para "${params.q}"` : "Todos los productos"}
            </h1>
            <p className="text-sm text-muted-foreground mb-3">{total} productos</p>
            {(params.category || params.city) && (
              <div className="flex flex-wrap gap-2">
                {params.category && (
                  <Link href={buildUrl({ ...params, category: undefined, page: undefined })}>
                    <Badge variant="secondary" className="cursor-pointer gap-1">
                      {params.category} ×
                    </Badge>
                  </Link>
                )}
                {params.city && (
                  <Link href={buildUrl({ ...params, city: undefined, page: undefined })}>
                    <Badge variant="secondary" className="cursor-pointer gap-1">
                      {params.city} ×
                    </Badge>
                  </Link>
                )}
              </div>
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
                      href={buildUrl({ ...params, page: String(p) })}
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
