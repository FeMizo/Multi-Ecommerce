import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SessionProvider } from "next-auth/react"
import { ResponsiveSidebarShell, type SidebarItem } from "@/components/layout/responsive-sidebar-shell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

const navItems: SidebarItem[] = [
  { href: "/admin", label: "Dashboard", iconKey: "LayoutDashboard" },
  { href: "/admin/marketing", label: "Marketing", iconKey: "Tag" },
  { href: "/admin/users", label: "Usuarios", iconKey: "Users" },
  { href: "/admin/sellers", label: "Vendedores", iconKey: "Store" },
  { href: "/admin/plans", label: "Planes", iconKey: "CreditCard" },
  { href: "/admin/orders", label: "Pedidos", iconKey: "ShoppingBag" },
  { href: "/admin/products", label: "Productos", iconKey: "Package" },
  { href: "/admin/cities", label: "Ciudades", iconKey: "MapPin" },
  { href: "/admin/metrics", label: "Metricas", iconKey: "BarChart3" },
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
        topFooterHref="/"
        topFooterLabel="Ir al home"
        topFooterIconKey="ArrowLeft"
        footerHref="/dashboard"
        footerLabel="Ir al dashboard"
        footerIconKey="ArrowLeft"
        variant="admin"
        storageKey="admin-sidebar"
      >
        {children}
      </ResponsiveSidebarShell>
    </SessionProvider>
  )
}
