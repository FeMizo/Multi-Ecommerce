import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SessionProvider } from "next-auth/react"
import { ResponsiveSidebarShell, type SidebarItem } from "@/components/layout/responsive-sidebar-shell"

const navItems: SidebarItem[] = [
  { href: "", label: "Dashboard", iconKey: "LayoutDashboard" },
  { href: "/products", label: "Productos", iconKey: "Package" },
  { href: "/orders", label: "Pedidos", iconKey: "ShoppingBag" },
  { href: "/coupons", label: "Cupones", iconKey: "Tag" },
  { href: "/metrics", label: "Metricas", iconKey: "BarChart3" },
  { href: "/settings", label: "Configuracion", iconKey: "Settings" },
]

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()

  if (!session?.user) redirect("/login")

  const membership = await db.storeMember.findFirst({
    where: {
      userId: session.user.id,
      store: { slug: storeSlug },
      role: { in: ["OWNER", "STAFF"] },
    },
    include: { store: { select: { name: true, slug: true, primaryColor: true } } },
  })

  if (!membership) redirect("/dashboard")

  const base = `/dashboard/${storeSlug}`
  const storeColor = membership.store.primaryColor

  return (
    <SessionProvider session={session}>
      <ResponsiveSidebarShell
        brandHref="/"
        brandTitle={membership.store.name}
        brandSubtitle="Dashboard"
        brandImageAlt="AionSite"
        items={navItems.map((item) => ({ ...item, href: `${base}${item.href}` }))}
        footerHref={`/${storeSlug}`}
        footerLabel="Ver tienda"
        footerIconKey="ArrowUpRight"
        footerExternal
        variant="dashboard"
        storageKey={`dashboard-sidebar:${storeSlug}`}
      >
        <div
          style={storeColor ? ({ "--primary": storeColor, "--primary-foreground": "#ffffff" } as React.CSSProperties) : undefined}
          className="min-h-screen"
        >
          {children}
        </div>
      </ResponsiveSidebarShell>
    </SessionProvider>
  )
}
