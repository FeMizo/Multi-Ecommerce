import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SessionProvider } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  ChevronDown,
} from "lucide-react"

const navItems = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/metrics", label: "Métricas", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
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
      <div
        className="flex min-h-screen"
        style={storeColor ? ({ "--primary": storeColor, "--primary-foreground": "#ffffff" } as React.CSSProperties) : undefined}
      >
        <aside className="w-60 border-r bg-card shrink-0 flex flex-col">
          <div className="p-4 border-b" style={storeColor ? { borderTopColor: storeColor, borderTopWidth: 3 } : undefined}>
            <Link href="/" className="inline-block">
              <Image src="/logo.png" alt="AionSite" width={110} height={32} className="h-7 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary">
              <span className="truncate">{membership.store.name}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={`${base}${href}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Link
              href={`/${storeSlug}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
            >
              Ver tienda →
            </Link>
          </div>
        </aside>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  )
}
