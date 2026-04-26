import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  title: { default: "Mercado Local", template: "%s | Mercado Local" },
  description: "El marketplace de tu comunidad. Compra y vende productos locales.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
