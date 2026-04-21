import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SessionProvider } from "next-auth/react"
import Link from "next/link"
import { LayoutDashboard, Users, Store, Package, BarChart3, Settings, MapPin } from "lucide-react"

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/sellers", label: "Vendedores", icon: Store },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/cities", label: "Ciudades", icon: MapPin },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart3 },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/")

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen">
        <aside className="w-60 border-r bg-slate-900 text-slate-100 shrink-0 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <Link href="/admin" className="font-bold text-lg">Admin Panel</Link>
            <p className="text-xs text-slate-400 mt-1">Mercado Local</p>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-slate-800">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-300">
              ← Volver al marketplace
            </Link>
          </div>
        </aside>
        <main className="flex-1 p-6 bg-muted/30 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  )
}
