import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { DEFAULT_SHOP_BANNER } from "@/lib/placeholders"
import { absoluteUrl, siteUrl } from "@/lib/site-url"
import { buildKeywords } from "@/lib/seo"
import { jsonLdScript, organizationJsonLd, webSiteJsonLd } from "@/lib/seo-jsonld"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "AionSite Shop", template: "%s | AionSite Shop" },
  description: "AionSite Shop es un marketplace local para comprar y vender productos en México.",
  keywords: buildKeywords("AionSite Shop", ["comprar y vender productos", "catalogo local", "tiendas locales"]),
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AionSite Shop",
    description: "AionSite Shop es un marketplace local para comprar y vender productos en México.",
    url: "/",
    siteName: "AionSite Shop",
    locale: "es_MX",
    type: "website",
    images: [absoluteUrl(DEFAULT_SHOP_BANNER)],
  },
  twitter: {
    card: "summary_large_image",
    title: "AionSite Shop",
    description: "AionSite Shop es un marketplace local para comprar y vender productos en México.",
    images: [absoluteUrl(DEFAULT_SHOP_BANNER)],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased bg-background`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(webSiteJsonLd()) }} />
        {children}
        <Toaster richColors position="bottom-left" />
      </body>
    </html>
  )
}
