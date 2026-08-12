import { absoluteUrl, siteUrl } from "@/lib/site-url"

type BreadcrumbItem = {
  name: string
  url: string
}

type ProductJsonLdInput = {
  name: string
  description?: string | null
  images: string[]
  sku?: string | null
  price: number
  availability: "InStock" | "OutOfStock"
  url: string
  categoryName?: string | null
  storeName: string
  storeUrl: string
}

function toJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
}

function toAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : absoluteUrl(value)
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AionSite Shop",
    url: siteUrl,
    logo: absoluteUrl("/logo.png"),
    sameAs: [
      "https://www.facebook.com/shopaionsite",
      "https://www.instagram.com/shopaionsite/",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "ayuda@aionsite.com.mx",
        telephone: "+52 938 157 3988",
        areaServed: "MX",
        availableLanguage: ["es"],
      },
    ],
  }
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AionSite Shop",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function productJsonLd(input: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ?? undefined,
    image: input.images.map((image) => toAbsoluteUrl(image)),
    sku: input.sku ?? undefined,
    category: input.categoryName ?? undefined,
    brand: {
      "@type": "Brand",
      name: input.storeName,
    },
    offers: {
      "@type": "Offer",
      url: input.url,
      priceCurrency: "MXN",
      price: input.price.toFixed(2),
      availability: input.availability === "InStock"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: input.storeName,
        url: input.storeUrl,
      },
    },
    url: input.url,
  }
}

export function jsonLdScript(data: unknown) {
  return toJsonLd(data)
}
