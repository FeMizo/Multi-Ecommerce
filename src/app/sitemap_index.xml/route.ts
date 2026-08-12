import { db } from "@/lib/db"
import { renderSitemapIndex } from "@/lib/sitemap"
import { siteUrl } from "@/lib/site-url"

export const revalidate = 3600

export async function GET() {
  let storesUpdatedAt = new Date()
  let productsUpdatedAt = new Date()

  try {
    const [stores, products] = await Promise.all([
      db.store.aggregate({
        where: { isActive: true, deletedAt: null },
        _max: { updatedAt: true },
      }),
      db.product.aggregate({
        where: { status: "ACTIVE", deletedAt: null },
        _max: { updatedAt: true },
      }),
    ])
    storesUpdatedAt = stores._max.updatedAt ?? storesUpdatedAt
    productsUpdatedAt = products._max.updatedAt ?? productsUpdatedAt
  } catch {
    // Fall back to static timestamps when the database is unavailable during build.
  }

  return new Response(
    renderSitemapIndex([
      { loc: `${siteUrl}/sitemap_tiendas.xml`, lastmod: storesUpdatedAt },
      { loc: `${siteUrl}/sitemap_productos.xml`, lastmod: productsUpdatedAt },
    ]),
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  )
}
