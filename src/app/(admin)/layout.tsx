import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SessionProvider } from "next-auth/react"
import Link from "next/link"
import {
  ArrowLeft,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react"
import { ResponsiveSidebarShell } from "@/components/layout/responsive-sidebar-shell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/sellers", label: "Vendedores", icon: Store },
  { href: "/admin/plans", label: "Planes", icon: CreditCard },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/cities", label: "Ciudades", icon: MapPin },
  { href: "/admin/metrics", label: "Metricas", icon: BarChart3 },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") redirect("/")

  return (
    <SessionProvider session={session}>
      <ResponsiveSidebarShell
        brandHref="/admin"
        brandTitle="Admin Panel"
        brandSubtitle="Marketplace"
        brandImageAlt="AionSite"
        brandImageClassName="brightness-0 invert"
        items={navItems}
        variant="admin"
        storageKey="admin-sidebar"
        footer={(collapsed) => (
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-medium transition-colors"
            title="Volver al marketplace"
            aria-label="Volver al marketplace"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>Volver al marketplace</span> : <span className="sr-only">Volver al marketplace</span>}
          </Link>
        )}
      >
        {children}
      </ResponsiveSidebarShell>
    </SessionProvider>
  )
}
