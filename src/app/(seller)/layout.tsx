import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SessionProvider } from "next-auth/react"
import Link from "next/link"
import { LayoutDashboard, Package, ShoppingBag, BarChart3, Settings, Store } from "lucide-react"

const nav = [
  { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/seller/products", label: "Productos", icon: Package },
  { href: "/seller/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/seller/metrics", label: "Métricas", icon: BarChart3 },
  { href: "/seller/settings", label: "Configuración", icon: Settings },
]

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "SELLER" && session.user.role !== "ADMIN")) {
    redirect("/login")
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen">
        <aside className="w-60 border-r bg-card shrink-0 flex flex-col">
          <div className="p-4 border-b">
            <Link href="/" className="flex items-center gap-2 font-bold text-primary">
              <Store className="h-5 w-5" />
              Mercado Local
            </Link>
            <p className="text-xs text-muted-foreground mt-1">Panel del vendedor</p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  )
}
