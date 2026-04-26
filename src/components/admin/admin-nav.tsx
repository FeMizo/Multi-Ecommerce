"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Store, Package, BarChart3, MapPin } from "lucide-react"

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/sellers", label: "Vendedores", icon: Store },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/cities", label: "Ciudades", icon: MapPin },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart3 },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-3 space-y-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? "bg-slate-700 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
