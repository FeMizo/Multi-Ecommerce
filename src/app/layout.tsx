import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { siteUrl } from "@/lib/site-url"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "AionSite", template: "%s | AionSite" },
  description: "Multi Store. One Ecosystem. Compra y vende productos locales.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AionSite",
    description: "Multi Store. One Ecosystem. Compra y vende productos locales.",
    url: "/",
    siteName: "AionSite",
    locale: "es_MX",
    type: "website",
  },
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased bg-background`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="bottom-left" />
      </body>
    </html>
  )
}
