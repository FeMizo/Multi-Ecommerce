import { formatPrice } from "@/lib/utils"
import { plural } from "@/lib/plural"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, X } from "lucide-react"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/products/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buildKeywords } from "@/lib/seo"
import { SearchForm } from "@/components/public/search-form"
import { normalizeVariantOptions } from "@/lib/product-variants"

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

type SearchParams = { q?: string; category?: string; min?: string; max?: string; minPrice?: string; maxPrice?: string; availability?: "available" | "out-of-stock"; page?: string }

function isProductAvailable(product: { manageStock: boolean; stock: number; variantOptions: unknown }) {
  if (!product.manageStock) return true
  const options = normalizeVariantOptions(product.variantOptions ?? [])
  if (!options.length) return product.stock > 0

  const hasVariantQuantities = options.some((option) => option.values.some((value) => value.quantity !== null && value.quantity !== undefined))
  if (!hasVariantQuantities) return product.stock > 0

  return options.every((option) => {
    const quantities = option.values.map((value) => value.quantity).filter((quantity): quantity is number => typeof quantity === "number")
    return quantities.length === 0 || quantities.some((quantity) => quantity > 0)
  })
}

function parsePrice(value?: string) {
  if (!value?.trim()) return undefined
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : undefined
}

async function searchProducts(params: SearchParams) {
  const page = Number.isSafeInteger(Number(params.page)) && Number(params.page) > 0 ? Number(params.page) : 1
  const take = 24
  const skip = (page - 1) * take

  const where: Record<string, unknown> = {
    status: "ACTIVE",
    deletedAt: null,
    store: { isActive: true, deletedAt: null },
  }

  if (params.q) where.name = { contains: params.q, mode: "insensitive" }
  if (params.category) where.category = { OR: [{ slug: params.category }, { parent: { slug: params.category } }] }
  const min = parsePrice(params.minPrice ?? params.min)
  const max = parsePrice(params.maxPrice ?? params.max)
  if (min !== undefined || max !== undefined) {
    where.price = { ...(min !== undefined ? { gte: min } : {}), ...(max !== undefined ? { lte: max } : {}) }
  }

  const availabilityFilter = params.availability
  const shouldFilterAvailability = availabilityFilter === "available" || availabilityFilter === "out-of-stock"
  const availabilityWhere = shouldFilterAvailability ? { ...where } : where

  const allProducts = await db.product.findMany({
      where: availabilityWhere,
      include: { store: { select: { name: true, primaryColor: true, slug: true } }, category: true },
      orderBy: { createdAt: "desc" },
    })
  const filteredProducts = shouldFilterAvailability
    ? allProducts.filter((product) => isProductAvailable(product) === (availabilityFilter === "available"))
    : allProducts
  const products = filteredProducts.slice(skip, skip + take)
  const total = filteredProducts.length

  return { products, total, page, pages: Math.ceil(total / take) }
}

async function getCategories() {
  return db.category.findMany({
    where: {
      active: true,
      parentId: null,
      products: {
        some: {
          status: "ACTIVE",
          deletedAt: null,
          store: { isActive: true, deletedAt: null },
        },
      },
    },
    include: {
      _count: {
        select: {
          products: {
            where: {
              status: "ACTIVE",
              deletedAt: null,
              store: { isActive: true, deletedAt: null },
            },
          },
        },
      },
    },
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

  return <div className="container mx-auto max-w-6xl px-4 py-6 md:py-8">
    <h1 className="mb-5 text-3xl font-semibold">Buscar productos</h1>
    <SearchForm key={JSON.stringify(params)} initialParams={params} categories={categories.map((category) => ({ slug: category.slug, name: category.name }))} />
    <section aria-labelledby="results-heading" className="mt-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 id="results-heading" className="text-xl font-semibold">{params.q ? `Resultados para “${params.q}”` : params.category ? `Productos de ${activeCategory?.name ?? params.category}` : params.availability || params.minPrice || params.maxPrice || params.min || params.max ? "Productos filtrados" : "Todos los productos"}</h2><p className="mt-1 text-sm text-muted-foreground" role="status">{plural(total, "producto")}</p></div>{Object.values(params).some(Boolean) && <Link href="/search" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm underline underline-offset-4">Limpiar filtros</Link>}</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {params.category && <Badge variant="secondary" className="gap-1">{activeCategory?.name ?? params.category}<Link className="inline-flex h-11 w-11 items-center justify-center" href={buildUrl({ ...params, category: undefined, page: undefined })} aria-label="Quitar categoría"><X aria-hidden="true" className="h-4 w-4" /></Link></Badge>}
        {(parsePrice(params.minPrice ?? params.min) !== undefined || parsePrice(params.maxPrice ?? params.max) !== undefined) && <Badge variant="secondary">Precio: {formatPrice(parsePrice(params.minPrice ?? params.min) ?? 0)} – {parsePrice(params.maxPrice ?? params.max) === undefined ? "sin máximo" : formatPrice(parsePrice(params.maxPrice ?? params.max)!)}</Badge>}
        {params.availability && <Badge variant="secondary">{params.availability === "available" ? "Disponibles" : "Agotados"}</Badge>}
      </div>
      {!products.length ? <div className="border-y py-16 text-center"><h3 className="text-xl font-semibold">No se encontraron productos</h3><p className="mt-2 text-muted-foreground">Prueba otra búsqueda o cambia los filtros.</p><Button asChild className="mt-5 min-h-11"><Link href="/search">Limpiar búsqueda<ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link></Button></div> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      {pages > 1 && <nav aria-label="Páginas de resultados" className="mt-8 flex flex-wrap justify-center gap-2">{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <Link key={number} href={buildUrl({ ...params, page: String(number) })} aria-current={number === page ? "page" : undefined} aria-label={`Página ${number}`} className={`flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 ${number === page ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>{number}</Link>)}</nav>}
    </section>
  </div>
}
