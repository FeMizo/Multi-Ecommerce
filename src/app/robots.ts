import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/account/",
        "/admin",
        "/admin/",
        "/api/",
        "/cart",
        "/cart/",
        "/checkout",
        "/checkout/",
        "/dashboard",
        "/dashboard/",
        "/forgot-password",
        "/forgot-password/",
        "/login",
        "/login/",
        "/onboarding",
        "/onboarding/",
        "/register",
        "/register/",
        "/reset-password",
        "/reset-password/",
        "/seller",
        "/seller/",
      ],
    },
    sitemap: [
      `${siteUrl}/sitemap_index.xml`,
      `${siteUrl}/sitemap_tiendas.xml`,
      `${siteUrl}/sitemap_productos.xml`,
    ],
    host: siteUrl,
  }
}
