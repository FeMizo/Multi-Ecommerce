import { db } from "@/lib/db"
import { renderUrlSet } from "@/lib/sitemap"
import { siteUrl } from "@/lib/site-url"

export const revalidate = 3600

export async function GET() {
  const stores = await db.store.findMany({
    where: { isActive: true, deletedAt: null },
    select: { slug: true, updatedAt: true },
    orderBy: { slug: "asc" },
  })

  const pages = [
    { loc: siteUrl, lastmod: new Date(), changefreq: "daily" as const, priority: 1 },
    { loc: `${siteUrl}/stores`, lastmod: new Date(), changefreq: "daily" as const, priority: 0.9 },
    { loc: `${siteUrl}/categories`, lastmod: new Date(), changefreq: "daily" as const, priority: 0.8 },
    { loc: `${siteUrl}/offers`, lastmod: new Date(), changefreq: "daily" as const, priority: 0.8 },
    { loc: `${siteUrl}/plans`, lastmod: new Date(), changefreq: "weekly" as const, priority: 0.7 },
    { loc: `${siteUrl}/help`, lastmod: new Date(), changefreq: "monthly" as const, priority: 0.5 },
    { loc: `${siteUrl}/terms`, lastmod: new Date(), changefreq: "yearly" as const, priority: 0.3 },
    { loc: `${siteUrl}/privacy`, lastmod: new Date(), changefreq: "yearly" as const, priority: 0.3 },
    { loc: `${siteUrl}/cookies`, lastmod: new Date(), changefreq: "yearly" as const, priority: 0.3 },
    { loc: `${siteUrl}/sitemap`, lastmod: new Date(), changefreq: "monthly" as const, priority: 0.4 },
  ]

  return new Response(
    renderUrlSet([
      ...pages,
      ...stores.map((store) => ({
        loc: `${siteUrl}/${store.slug}`,
        lastmod: store.updatedAt,
        changefreq: "daily" as const,
        priority: 0.8,
      })),
    ]),
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  )
}
