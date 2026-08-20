import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_SHOP_BANNER } from "@/lib/placeholders"
import { buildKeywords } from "@/lib/seo"
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/seo-jsonld"
import { absoluteUrl } from "@/lib/site-url"
import { formatCategoryLabel } from "@/lib/categories"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Categorias",
  description: "Explora productos de AionSite Shop por categoria.",
  keywords: buildKeywords("Categorias", ["categorias de productos", "catalogo por categoria", "compras locales"]),
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "Categorias | AionSite Shop",
    description: "Explora productos de AionSite Shop por categoria.",
    url: "/categories",
    siteName: "AionSite Shop",
    type: "website",
    images: [absoluteUrl(DEFAULT_SHOP_BANNER)],
  },
  twitter: {
    card: "summary_large_image",
    title: "Categorias | AionSite Shop",
    description: "Explora productos de AionSite Shop por categoria.",
    images: [absoluteUrl(DEFAULT_SHOP_BANNER)],
  },
}

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    where: { active: true, parentId: null },
    include: {
      children: {
        where: { active: true },
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
      },
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
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Inicio", url: "https://shop.aionsite.com.mx" },
    { name: "Categorias", url: "https://shop.aionsite.com.mx/categories" },
  ])

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-0">
        <Sparkles className="w-3 h-3 mr-1" />
        Categorias
      </Badge>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">Explora por categoria</h1>
      <p className="text-muted-foreground text-lg mb-10">Encuentra productos por tipo, estilo o necesidad.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => (
          <div key={category.id} className="rounded-2xl border bg-card p-6">
            <Link href={`/search?category=${category.slug}`} className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">{category.name}</h2>
                <p className="text-sm text-muted-foreground">{category._count.products} productos</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            {category.children.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/search?category=${child.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm hover:border-primary/30 hover:bg-primary/5"
                  >
                    <span>{formatCategoryLabel({ name: child.name, parent: { name: category.name } })}</span>
                    <span className="text-xs text-muted-foreground">{child._count.products}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
