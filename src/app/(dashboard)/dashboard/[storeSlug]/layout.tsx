import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SessionProvider } from "next-auth/react"
import { ResponsiveSidebarShell, type SidebarItem } from "@/components/layout/responsive-sidebar-shell"
import { SubscriptionRenewalReminder } from "@/components/dashboard/subscription-renewal-reminder"
import { PhoneReminderBanner } from "@/components/dashboard/phone-reminder-banner"

const navItems: SidebarItem[] = [
  { href: "", label: "Dashboard", iconKey: "LayoutDashboard", exact: true },
  { href: "/products", label: "Productos", iconKey: "Package" },
  { href: "/orders", label: "Pedidos", iconKey: "ShoppingBag" },
  { href: "/delivery", label: "Delivery", iconKey: "Truck" },
  { href: "/coupons", label: "Cupones", iconKey: "Tag" },
  { href: "/planes", label: "Planes", iconKey: "CreditCard" },
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

  const isPlatformAdmin = session.user.globalRole === "PLATFORM_ADMIN"
  const [membership, adminStore, user] = await Promise.all([
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
    isPlatformAdmin
      ? db.store.findUnique({
          where: { slug: storeSlug },
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
        })
      : null,
    db.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    }),
  ])

  const store = membership?.store ?? adminStore
  if (!store) redirect("/dashboard")

  const base = `/dashboard/${storeSlug}`
  const storeColor = store.primaryColor

  return (
    <SessionProvider session={session}>
      <ResponsiveSidebarShell
        brandHref="/"
        brandTitle={store.name}
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
            storeId={store.id}
            storeName={store.name}
            subscription={store.subscription ? {
              status: store.subscription.status,
              currentPeriodEnd: store.subscription.currentPeriodEnd?.toISOString() ?? null,
              cancelAtPeriodEnd: store.subscription.cancelAtPeriodEnd,
            } : null}
          />
          {children}
        </div>
      </ResponsiveSidebarShell>
    </SessionProvider>
  )
}
