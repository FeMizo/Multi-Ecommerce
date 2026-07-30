import Link from "next/link"
import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, FileText, Map, Package } from "lucide-react"
import { siteUrl } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "Mapa del sitio",
  description: "Mapa del sitio de AionSite Shop con accesos al sitemap index, tiendas y productos.",
}

const links = [
  {
    href: "/sitemap_index.xml",
    title: "Sitemap index",
    description: "Indice principal que referencia todos los sitemaps del sitio.",
    icon: FileText,
  },
  {
    href: "/sitemap_tiendas.xml",
    title: "Sitemap tiendas",
    description: "Paginas publicas, tiendas activas y rutas editoriales.",
    icon: Map,
  },
  {
    href: "/sitemap_productos.xml",
    title: "Sitemap productos",
    description: "Productos activos con sus imagenes absolutas.",
    icon: Package,
  },
]

export default function SitemapPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <section className="rounded-3xl border bg-gradient-to-br from-background via-background to-primary/10 p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>SEO</Badge>
          <Badge variant="outline">XML + HTML</Badge>
          <Badge variant="secondary">{siteUrl}</Badge>
        </div>
        <div className="mt-4 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Mapa del sitio</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Esta pagina agrupa los sitemaps publicos en una vista simple. Usala para revisar que URLs
            se le entregan a Google y a otros rastreadores.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.href} className="border-border/60 shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Abrir XML
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
