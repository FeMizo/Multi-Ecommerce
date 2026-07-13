import type { MetadataRoute } from "next"

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://shop.aionsite.com.mx")
  .replace(/\/$/, "")

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/",
        "/admin/",
        "/api/",
        "/cart",
        "/checkout/",
        "/dashboard/",
        "/forgot-password",
        "/login",
        "/onboarding",
        "/register",
        "/reset-password/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
