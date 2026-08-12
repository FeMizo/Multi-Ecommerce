import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_SHOP_BANNER } from "@/lib/placeholders"
import { buildKeywords } from "@/lib/seo"
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/seo-jsonld"
import { absoluteUrl } from "@/lib/site-url"
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.id} href={`/search?category=${category.slug}`} className="rounded-2xl border bg-card p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">{category.name}</h2>
                <p className="text-sm text-muted-foreground">{category._count.products} productos</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
