import { Navbar } from "@/components/layout/navbar"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/lib/auth"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Mail, Phone } from "lucide-react"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <a
        href="https://wa.me/529381573988"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp para dudas"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .17 5.33.17 11.89c0 2.09.55 4.14 1.6 5.94L.07 24l6.32-1.66a11.9 11.9 0 0 0 5.67 1.44h.01c6.56 0 11.89-5.33 11.89-11.89 0-3.17-1.23-6.16-3.44-8.41ZM12.07 21.77h-.01a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.65-.24-.38a9.84 9.84 0 0 1-1.51-5.24c0-5.46 4.45-9.9 9.91-9.9a9.84 9.84 0 0 1 7 2.9 9.84 9.84 0 0 1 2.9 7c0 5.46-4.44 9.88-9.9 9.88Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
        </svg>
      </a>
      
      {/* Footer */}
      <footer className="border-t border-border/50 bg-card mt-auto">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-block mb-4">
                <Image src="/logo.png" alt="AionSite" width={130} height={38} className="h-9 w-auto object-contain" />
              </Link>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                El marketplace de tu comunidad. Conectamos compradores y vendedores locales.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://www.facebook.com/aionsite" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Facebook">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com/aionsite.webs/" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors" aria-label="Instagram">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h3 className="font-semibold text-sm mb-4">Explora</h3>
              <ul className="space-y-3">
                <li><Link href="/stores" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tiendas</Link></li>
                <li><Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Productos</Link></li>
                <li><Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Categorías</Link></li>
                <li><Link href="/offers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Ofertas</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm mb-4">Vendedores</h3>
              <ul className="space-y-3">
                <li><Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Abrir tienda</Link></li>
                <li><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Panel de vendedor</Link></li>
                <li><Link href="/plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planes y precios</Link></li>
                <li><Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Centro de ayuda</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm mb-4">Contacto</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href="mailto:ayuda@aionsite.com.mx" className="hover:text-foreground transition-colors">
                    ayuda@aionsite.com.mx
                  </a>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href="tel:+529381573988" className="hover:text-foreground transition-colors">
                    +52 938 157 3988
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Tu ciudad, tu país</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AionSite. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">Términos</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </SessionProvider>
  )
}
