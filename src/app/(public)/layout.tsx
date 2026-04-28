import { Navbar } from "@/components/layout/navbar"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Store, MapPin, Mail, Phone, Facebook, Instagram, Twitter } from "lucide-react"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      <Navbar />
      <main className="flex-1">{children}</main>
      
      {/* Footer */}
      <footer className="border-t border-border/50 bg-card mt-auto">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-foreground">Mercado Local</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                El marketplace de tu comunidad. Conectamos compradores y vendedores locales.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h3 className="font-semibold text-sm mb-4">Explora</h3>
              <ul className="space-y-3">
                <li><Link href="/stores" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tiendas</Link></li>
                <li><Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Productos</Link></li>
                <li><Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Categorías</Link></li>
                <li><Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Ofertas</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm mb-4">Vendedores</h3>
              <ul className="space-y-3">
                <li><Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Abrir tienda</Link></li>
                <li><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Panel de vendedor</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planes y precios</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Centro de ayuda</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm mb-4">Contacto</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>hola@mercadolocal.com</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+1 234 567 890</span>
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
              © {new Date().getFullYear()} Mercado Local. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Términos</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Privacidad</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </SessionProvider>
  )
}
