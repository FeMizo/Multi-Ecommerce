import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Filter, PackageSearch, Sparkles, Store, X } from "lucide-react"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildKeywords } from "@/lib/seo"
import { SearchForm } from "@/components/public/search-form"

export const metadata: Metadata = {
  title: "Productos",
  description: "Busca productos locales disponibles en AionSite Shop.",
  keywords: buildKeywords("Productos", ["catalogo de productos", "buscador de productos", "tienda online"]),
  alternates: { canonical: "/search" },
  robots: {
    index: false,
    follow: true,
  },
}

type SearchParams = { q?: string; category?: string; min?: string; max?: string; page?: string }

async function searchProducts(params: SearchParams) {
  const page = Number(params.page ?? 1)
  const take = 24
  const skip = (page - 1) * take

  const where: Record<string, unknown> = {
    status: "ACTIVE",
    store: { isActive: true, deletedAt: null },
  }

  if (params.q) where.name = { contains: params.q, mode: "insensitive" }
  if (params.category) where.category = { slug: params.category }
  if (params.min || params.max) {
    where.price = {
      ...(params.min ? { gte: Number(params.min) } : {}),
      ...(params.max ? { lte: Number(params.max) } : {}),
    }
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: { store: { select: { name: true, primaryColor: true, slug: true } }, category: true },
      take,
      skip,
      orderBy: { createdAt: "desc" },
    }),
    db.product.count({ where }),
  ])

  return { products, total, page, pages: Math.ceil(total / take) }
}

async function getCategories() {
  return db.category.findMany({
    where: { active: true, parentId: null },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })
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
  const [{ products, total, page, pages }, categories] = await Promise.all([
    searchProducts(params),
    getCategories(),
  ])

  const activeCategory = categories.find((category) => category.slug === params.category)

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 surface-grid opacity-40" />
      <div className="container mx-auto px-4 py-8 relative">
        <section className="mb-10 rounded-[2rem] border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                <PackageSearch className="mr-1 h-3.5 w-3.5" />
                Descubrimiento
              </Badge>
              <h1 className="editorial-title text-4xl md:text-5xl">Encuentra lo correcto, más rápido.</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Filtra por producto, categoría y rango. El catálogo está curado para que el usuario llegue antes a la compra.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Resultados", value: total.toLocaleString("es-MX") },
                { label: "Categorías", value: categories.length.toLocaleString("es-MX") },
                { label: "Atajos", value: "Búsqueda + filtros" },
                { label: "Confianza", value: "Tiendas activas" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-border/60 bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-border/60 bg-background p-5">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Filtros</h2>
              </div>
              <SearchForm initialParams={params} />
              <p className="mt-3 text-xs text-muted-foreground">Busca por producto o categoría.</p>
            </div>

            <div className="rounded-[1.75rem] border border-border/60 bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Categorías</h2>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">{categories.length}</Badge>
              </div>
              <div className="space-y-1">
                <Link
                  href={buildUrl({ ...params, category: undefined, page: undefined })}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-accent ${
                    !params.category ? "bg-accent font-medium" : ""
                  }`}
                >
                  <span>Todas</span>
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={buildUrl({ ...params, category: cat.slug, page: undefined })}
                    className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-accent ${
                      params.category === cat.slug ? "bg-accent font-medium" : ""
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat._count.products}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border/60 bg-foreground p-5 text-background">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Tip</p>
              <p className="mt-2 text-sm leading-6 text-background/75">
                Prioriza búsquedas cortas y categorías precisas para encontrar productos con menos fricción.
              </p>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="rounded-[1.75rem] border border-border/60 bg-background p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Catálogo</p>
                  <h2 className="mt-1 text-2xl font-semibold">
                    {params.q ? `Resultados para "${params.q}"` : "Todos los productos"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeCategory && (
                    <Badge variant="secondary" className="gap-2 rounded-full bg-primary/10 text-primary border-0">
                      {activeCategory.name}
                      <Link href={buildUrl({ ...params, category: undefined, page: undefined })} aria-label="Quitar categoría">
                        <X className="h-3.5 w-3.5" />
                      </Link>
                    </Badge>
                  )}
                  <Badge variant="secondary" className="rounded-full bg-muted text-muted-foreground border-0">
                    {total.toLocaleString("es-MX")} productos
                  </Badge>
                </div>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-border/80 bg-card px-6 py-16 text-center">
                <p className="text-xl font-semibold">No se encontraron productos</p>
                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  Prueba otra categoría o cambia el texto de búsqueda para ampliar resultados.
                </p>
                <Button asChild className="mt-6 rounded-full">
                  <Link href="/search">
                    Limpiar búsqueda
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pages > 1 && (
                  <div className="flex flex-wrap justify-center gap-2 pt-4">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                      <Link
                        key={p}
                        href={buildUrl({ ...params, page: String(p) })}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                          p === page ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
                        }`}
                      >
                        {p}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
