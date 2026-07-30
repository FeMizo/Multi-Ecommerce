import { db } from "@/lib/db"
import { renderSitemapIndex } from "@/lib/sitemap"
import { siteUrl } from "@/lib/site-url"

export const revalidate = 3600

export async function GET() {
  const [storesUpdatedAt, productsUpdatedAt] = await Promise.all([
    db.store.aggregate({
      where: { isActive: true, deletedAt: null },
      _max: { updatedAt: true },
    }),
    db.product.aggregate({
      where: { status: "ACTIVE", deletedAt: null },
      _max: { updatedAt: true },
    }),
  ])

  return new Response(
    renderSitemapIndex([
      { loc: `${siteUrl}/sitemap_tiendas.xml`, lastmod: storesUpdatedAt._max.updatedAt ?? new Date() },
      { loc: `${siteUrl}/sitemap_productos.xml`, lastmod: productsUpdatedAt._max.updatedAt ?? new Date() },
    ]),
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  )
}
