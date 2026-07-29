import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SessionProvider } from "next-auth/react"
import Link from "next/link"
import { ArrowUpRight, BarChart3, LayoutDashboard, Package, Settings, ShoppingBag, Tag } from "lucide-react"
import { ResponsiveSidebarShell } from "@/components/layout/responsive-sidebar-shell"

const navItems = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/coupons", label: "Cupones", icon: Tag },
  { href: "/metrics", label: "Metricas", icon: BarChart3 },
  { href: "/settings", label: "Configuracion", icon: Settings },
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
        variant="dashboard"
        storageKey={`dashboard-sidebar:${storeSlug}`}
        footer={(collapsed) => (
          <Link
            href={`/${storeSlug}`}
            className="flex items-center gap-2 text-xs font-medium transition-colors"
            target="_blank"
            rel="noreferrer"
            title="Ver tienda"
            aria-label="Ver tienda"
          >
            <ArrowUpRight className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>Ver tienda</span> : <span className="sr-only">Ver tienda</span>}
          </Link>
        )}
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
