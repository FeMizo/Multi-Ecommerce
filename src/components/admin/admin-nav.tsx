"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Store, Package, BarChart3, MapPin, ShoppingBag, CreditCard } from "lucide-react"

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/sellers", label: "Vendedores", icon: Store },
  { href: "/admin/plans", label: "Planes", icon: CreditCard },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/cities", label: "Ciudades", icon: MapPin },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart3 },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-3 pb-20 space-y-1 overflow-y-auto">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-background/60 hover:bg-background/10 hover:text-background"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
