import { db } from "@/lib/db"
import { renderUrlSet } from "@/lib/sitemap"
import { absoluteUrl, siteUrl } from "@/lib/site-url"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"

export const revalidate = 3600

export async function GET() {
  const products = await db.product.findMany({
    where: { status: "ACTIVE", deletedAt: null, store: { isActive: true, deletedAt: null } },
    select: {
      slug: true,
      updatedAt: true,
      images: true,
      store: { select: { slug: true } },
    },
    orderBy: [{ storeId: "asc" }, { slug: "asc" }],
  })

  return new Response(
    renderUrlSet(
      products.map((product) => ({
        loc: `${siteUrl}/${product.store.slug}/${product.slug}`,
        lastmod: product.updatedAt,
        changefreq: "weekly" as const,
        priority: 0.7,
        images: (product.images.length > 0 ? product.images : [DEFAULT_PRODUCT_IMAGE]).map((image) =>
          absoluteUrl(image)
        ),
      }))
    ),
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  )
}
