import Link from "next/link"
import Image from "next/image"
import { Package, Store, Sparkles } from "lucide-react"
import { ArrowRight as MorphArrowRight } from "lucide"
import { MorphLink } from "@/components/ui/morph-link"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { DEFAULT_SHOP_BANNER, DEFAULT_SHOP_ICON } from "@/lib/placeholders"
import { buildKeywords } from "@/lib/seo"
import { breadcrumbJsonLd, jsonLdScript } from "@/lib/seo-jsonld"
import { absoluteUrl } from "@/lib/site-url"
import { VerifiedBadge } from "@/components/public/verified-badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tiendas",
  description: "Directorio de tiendas locales activas en AionSite Shop.",
  keywords: buildKeywords("Tiendas", ["tiendas locales", "tiendas activas", "directorio de vendedores"]),
  alternates: { canonical: "/stores" },
  openGraph: {
    title: "Tiendas | AionSite Shop",
    description: "Directorio de tiendas locales activas en AionSite Shop.",
    url: "/stores",
    siteName: "AionSite Shop",
    type: "website",
    images: [absoluteUrl(DEFAULT_SHOP_BANNER)],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiendas | AionSite Shop",
    description: "Directorio de tiendas locales activas en AionSite Shop.",
    images: [absoluteUrl(DEFAULT_SHOP_BANNER)],
  },
}

async function getStores() {
  return db.store.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    include: {
      _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
    },
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
  })
}

export default async function StoresPage() {
  const stores = await getStores()
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Inicio", url: "https://shop.aionsite.com.mx" },
    { name: "Tiendas", url: "https://shop.aionsite.com.mx/stores" },
  ])

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <div className="bg-card border-b border-border/50">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-0">
              <Store className="w-3 h-3 mr-1" />
              Directorio
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">
              Descubre tiendas locales
            </h1>
            <p className="text-muted-foreground text-lg">
              {stores.length} tiendas activas listas para servirte. Apoya emprendedores de tu comunidad.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <Store className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay tiendas disponibles</h3>
            <p className="text-muted-foreground mb-6">
              Se el primero en abrir una tienda
            </p>
            <MorphLink
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              icon={MorphArrowRight}
              iconClassName="h-4 w-4"
            >
              Abrir mi tienda
            </MorphLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {stores.map((store, index) => (
              <Link
                key={store.id}
                href={`/${store.slug}`}
                className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              >
                <div className="relative h-32 md:h-36 bg-muted/50 overflow-hidden">
                  <Image
                    src={store.bannerUrl || DEFAULT_SHOP_BANNER}
                    alt={store.bannerUrl ? "" : `Banner generico de ${store.name}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                    {index < 3 && (
                      <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-full">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Destacada
                      </Badge>
                    )}
                    {store.isVerified && <VerifiedBadge compact className="text-xs px-2.5 py-1 rounded-full" />}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start gap-4 -mt-12 mb-4">
                    <div
                      className="z-20 h-16 w-16 rounded-2xl border-[3px] border-card bg-card flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden shadow-lg"
                      style={{ color: store.primaryColor ?? undefined }}
                    >
                      <Image
                        src={store.logoUrl || DEFAULT_SHOP_ICON}
                        alt={store.logoUrl ? store.name : `Icono generico de ${store.name}`}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                      {store.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                    <Package className="h-3.5 w-3.5" />
                    {store._count.products} productos
                  </div>

                  {store.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{store.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
