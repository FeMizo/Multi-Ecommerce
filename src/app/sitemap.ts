import type { MetadataRoute } from "next"
import { db } from "@/lib/db"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"
import { siteUrl } from "@/lib/site-url"

export const revalidate = 3600

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
    {
      url: `${siteUrl}/search`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/categories`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/offers`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/plans`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/help`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/cookies`,
      changeFrequency: "yearly",
      priority: 0.3,
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
        images: product.images.length > 0
          ? product.images
          : [`${siteUrl}${DEFAULT_PRODUCT_IMAGE}`],
      })),
    ]),
  ]
}
