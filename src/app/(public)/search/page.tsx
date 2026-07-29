import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildKeywords } from "@/lib/seo"
import Link from "next/link"
import { Search } from "lucide-react"
import type { Metadata } from "next"

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
      include: { store: { select: { name: true, primaryColor: true } }, category: true },
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
        <form action="/search" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Buscar productos, tiendas..."
              className="pl-10"
            />
          </div>
          <Button type="submit" className="sm:w-auto">
            Buscar
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Busca por producto o categoria.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="order-2 md:order-1 w-full md:w-56 shrink-0 space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Categorias</h3>
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
        </aside>

        <div className="order-1 md:order-2 flex-1">
          <div className="mb-6">
            <h1 className="text-xl font-bold">
              {params.q ? `Resultados para "${params.q}"` : "Todos los productos"}
            </h1>
            <p className="text-sm text-muted-foreground mb-3">{total} productos</p>
            {params.category && (
              <div className="flex flex-wrap gap-2">
                <Link href={buildUrl({ ...params, category: undefined, page: undefined })}>
                  <Badge variant="secondary" className="cursor-pointer gap-1">
                    {params.category} ×
                  </Badge>
                </Link>
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
