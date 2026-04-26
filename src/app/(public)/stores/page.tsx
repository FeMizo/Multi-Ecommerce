import Link from "next/link"
import Image from "next/image"
import { MapPin, Package, CheckCircle2 } from "lucide-react"
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Tiendas</h1>
        <p className="text-muted-foreground text-sm">{stores.length} tiendas disponibles</p>
      </div>

      {/* City filter */}
      {cities.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
          <Link
            href="/stores"
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition-colors ${
              !city ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent border-input"
            }`}
          >
            Todas las ciudades
          </Link>
          {cities.map((c) => (
            <Link
              key={c.slug}
              href={`/stores?city=${c.slug}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                city === c.slug ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent border-input"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {stores.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No hay tiendas disponibles{city ? " en esta ciudad" : ""}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/${store.slug}`}
              className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Banner */}
              <div className="relative h-28 bg-muted overflow-hidden">
                {store.bannerUrl ? (
                  <Image src={store.bannerUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: store.primaryColor ?? "#000000", opacity: 0.15 }}
                  />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start gap-3 -mt-8 mb-3">
                  <div
                    className="h-14 w-14 rounded-xl border-2 border-background bg-card flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden shadow-sm"
                    style={{ color: store.primaryColor ?? undefined }}
                  >
                    {store.logoUrl ? (
                      <Image src={store.logoUrl} alt={store.name} width={56} height={56} className="object-cover" />
                    ) : (
                      store.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="pt-8 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{store.name}</span>
                      {store.isVerified && (
                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {store.city ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {store.city.name}
                    </span>
                  ) : <span />}
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {store._count.products} productos
                  </span>
                </div>

                {store.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{store.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
