import type { MetadataRoute } from "next"
import { db } from "@/lib/db"

export const revalidate = 3600

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://shop.aionsite.com.mx")
  .replace(/\/$/, "")

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stores = await db.store.findMany({
    where: { isActive: true, deletedAt: null },
    select: {
      slug: true,
      updatedAt: true,
      products: {
        where: { status: "ACTIVE", deletedAt: null },
        select: { slug: true, updatedAt: true, images: true },
      },
    },
    orderBy: { slug: "asc" },
  })

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/stores`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...stores.flatMap((store): MetadataRoute.Sitemap => [
      {
        url: `${siteUrl}/${store.slug}`,
        lastModified: store.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      },
      ...store.products.map((product) => ({
        url: `${siteUrl}/${store.slug}/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        ...(product.images.length > 0 ? { images: product.images } : {}),
      })),
    ]),
  ]
}
