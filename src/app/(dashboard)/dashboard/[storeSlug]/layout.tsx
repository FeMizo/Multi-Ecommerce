import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SessionProvider } from "next-auth/react"
import { ResponsiveSidebarShell, type SidebarItem } from "@/components/layout/responsive-sidebar-shell"
import { SubscriptionRenewalReminder } from "@/components/dashboard/subscription-renewal-reminder"
import { PhoneReminderBanner } from "@/components/dashboard/phone-reminder-banner"

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

  const [membership, user] = await Promise.all([
    db.storeMember.findFirst({
      where: {
        userId: session.user.id,
        store: { slug: storeSlug },
        role: { in: ["OWNER", "STAFF"] },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            primaryColor: true,
            subscription: {
              select: {
                status: true,
                currentPeriodEnd: true,
                cancelAtPeriodEnd: true,
              },
            },
          },
        },
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    }),
  ])

  if (!membership) redirect("/dashboard")

  const base = `/dashboard/${storeSlug}`
  const storeColor = membership.store.primaryColor
  const isPlatformAdmin = session.user.globalRole === "PLATFORM_ADMIN"

  return (
    <SessionProvider session={session}>
      <ResponsiveSidebarShell
        brandHref="/"
        brandTitle={membership.store.name}
        brandSubtitle="Dashboard"
        brandImageAlt="AionSite"
        items={navItems.map((item) => ({ ...item, href: `${base}${item.href}` }))}
        topFooterHref="/"
        topFooterLabel="Volver al sitio"
        topFooterIconKey="ArrowLeft"
        footerHref={isPlatformAdmin ? "/admin" : `/${storeSlug}`}
        footerLabel={isPlatformAdmin ? "Ir al admin" : "Ver tienda"}
        footerIconKey={isPlatformAdmin ? "ArrowLeft" : "ArrowUpRight"}
        footerExternal={!isPlatformAdmin}
        variant="dashboard"
        storageKey={`dashboard-sidebar:${storeSlug}`}
      >
        <PhoneReminderBanner userId={session.user.id} hasPhone={Boolean(user?.phone?.trim())} />
        <div
          style={storeColor ? ({ "--primary": storeColor, "--primary-foreground": "#ffffff" } as React.CSSProperties) : undefined}
          className="min-h-screen"
        >
          <SubscriptionRenewalReminder
            storeId={membership.store.id}
            storeName={membership.store.name}
            subscription={membership.store.subscription ? {
              status: membership.store.subscription.status,
              currentPeriodEnd: membership.store.subscription.currentPeriodEnd?.toISOString() ?? null,
              cancelAtPeriodEnd: membership.store.subscription.cancelAtPeriodEnd,
            } : null}
          />
          {children}
        </div>
      </ResponsiveSidebarShell>
    </SessionProvider>
  )
}
