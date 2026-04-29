import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Store } from "lucide-react"
import { db } from "@/lib/db"

async function getStore(slug: string) {
  return db.store.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    select: { name: true, slug: true, logoUrl: true, primaryColor: true, city: { select: { name: true } } },
  })
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const store = await getStore(storeSlug)
  if (!store) notFound()

  const color = store.primaryColor ?? undefined

  return (
    <div style={color ? ({ "--primary": color, "--primary-foreground": "#ffffff" } as React.CSSProperties) : undefined}>
      {/* Store header strip */}
      <div className="border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="h-12 flex items-center gap-3">
            <Link href={`/${storeSlug}`} className="flex items-center gap-2.5 group">
              <div
                className="h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0 font-bold text-sm"
                style={{ backgroundColor: color ? `${color}18` : undefined, color }}
              >
                {store.logoUrl ? (
                  <Image src={store.logoUrl} alt={store.name} width={28} height={28} className="object-cover w-full h-full" />
                ) : (
                  <Store className="h-4 w-4" style={{ color }} />
                )}
              </div>
              <span className="text-sm font-semibold group-hover:text-primary transition-colors">{store.name}</span>
            </Link>

            {store.city && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
                <MapPin className="h-3 w-3" />
                {store.city.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {children}

      {/* Store footer */}
      <div className="border-t border-border/50 bg-card mt-12">
        <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href={`/${storeSlug}`} className="flex items-center gap-2.5 group">
            <div
              className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 font-bold"
              style={{ backgroundColor: color ? `${color}18` : undefined, color }}
            >
              {store.logoUrl ? (
                <Image src={store.logoUrl} alt={store.name} width={36} height={36} className="object-cover w-full h-full" />
              ) : (
                store.name[0].toUpperCase()
              )}
            </div>
            <span className="font-semibold group-hover:text-primary transition-colors">{store.name}</span>
          </Link>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
