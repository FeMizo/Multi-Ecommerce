import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  title: { default: "AionSite", template: "%s | AionSite" },
  description: "Multi Store. One Ecosystem. Compra y vende productos locales.",
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
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
