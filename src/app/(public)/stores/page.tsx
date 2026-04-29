import Link from "next/link"
import Image from "next/image"
import { MapPin, Package, CheckCircle2, Store, ArrowRight, Sparkles } from "lucide-react"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"

type SearchParams = { city?: string }

async function getStores(citySlug?: string) {
  return db.store.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      ...(citySlug ? { city: { slug: citySlug } } : {}),
    },
    include: {
      city: { select: { name: true, slug: true } },
      _count: { select: { products: { where: { status: "ACTIVE", deletedAt: null } } } },
    },
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
  })
}

async function getCities() {
  return db.city.findMany({
    where: { active: true },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  })
}

export default async function StoresPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { city } = await searchParams
  const [stores, cities] = await Promise.all([getStores(city), getCities()])

  return (
    <div className="min-h-screen">
      {/* Header */}
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
        {/* City filter */}
        {cities.length > 0 && (
          <div className="mb-8">
            <p className="text-sm font-medium text-muted-foreground mb-3">Filtrar por ciudad</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <Link
                href="/stores"
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  !city 
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" 
                    : "bg-card hover:bg-accent border-border/50 hover:border-primary/30"
                }`}
              >
                Todas las ciudades
              </Link>
              {cities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/stores?city=${c.slug}`}
                  className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                    city === c.slug 
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" 
                      : "bg-card hover:bg-accent border-border/50 hover:border-primary/30"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
              <Store className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay tiendas disponibles</h3>
            <p className="text-muted-foreground mb-6">
              {city ? "No encontramos tiendas en esta ciudad" : "Sé el primero en abrir una tienda"}
            </p>
            <Link 
              href="/register" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Abrir mi tienda
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {stores.map((store, index) => (
              <Link
                key={store.id}
                href={`/${store.slug}`}
                className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
              >
                {/* Banner */}
                <div className="relative h-32 md:h-36 bg-muted/50 overflow-hidden">
                  {store.bannerUrl ? (
                    <Image 
                      src={store.bannerUrl} 
                      alt="" 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/15 to-primary/5" />
                  )}
                  
                  {/* Featured Badge */}
                  {index < 3 && store.isVerified && (
                    <Badge className="absolute top-3 right-3 bg-primary/90 hover:bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-full">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Destacada
                    </Badge>
                  )}
                </div>

                <div className="p-5">
                  {/* Logo & Name */}
                  <div className="flex items-start gap-4 -mt-12 mb-4">
                    <div
                      className="h-16 w-16 rounded-2xl border-[3px] border-card bg-card flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden shadow-lg"
                      style={{ color: store.primaryColor ?? undefined }}
                    >
                      {store.logoUrl ? (
                        <Image src={store.logoUrl} alt={store.name} width={64} height={64} className="object-cover" />
                      ) : (
                        store.name[0].toUpperCase()
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                      {store.name}
                    </h3>
                    {store.isVerified && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    {store.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {store.city.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" />
                      {store._count.products} productos
                    </span>
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
