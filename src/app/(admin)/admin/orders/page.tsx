import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"
import { AdminSearch } from "@/components/admin/admin-search"
import { OrderStatus } from "@prisma/client"
import Link from "next/link"

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "Pagado", className: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Procesando", className: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", className: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Entregado", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Reembolsado", className: "bg-gray-100 text-gray-800" },
}

type SearchParams = { q?: string; status?: string; page?: string }

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const { q, status, page } = await searchParams
  const take = 50
  const skip = ((Number(page) || 1) - 1) * take

  const where = {
    deletedAt: null,
    ...(status ? { status: status as OrderStatus } : {}),
    ...(q ? {
      OR: [
        { customer: { name: { contains: q, mode: "insensitive" as const } } },
        { customer: { email: { contains: q, mode: "insensitive" as const } } },
        { store: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    } : {}),
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        customer: { select: { name: true, email: true } },
        store: { select: { name: true, slug: true } },
        _count: { select: { items: true } },
      },
    }),
    db.order.count({ where }),
  ])

  const statuses = Object.keys(statusConfig) as OrderStatus[]
  const buildHref = (s?: string) => {
    const params = new URLSearchParams()
    if (s) params.set("status", s)
    if (q) params.set("q", q)
    return `/admin/orders${params.size ? `?${params}` : ""}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className="flex items-center gap-3">
          <AdminSearch placeholder="Buscar cliente o tienda..." />
          <p className="text-sm text-muted-foreground shrink-0">{total} encontrados</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link
          href={buildHref()}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            !status ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent border-input"
          }`}
        >
          Todos
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={buildHref(s)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              status === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent border-input"
            }`}
          >
            {statusConfig[s].label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">ID</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Tienda</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Items</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Fee</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const cfg = statusConfig[order.status]
                  return (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="p-4">
                        <Link
                          href={`/dashboard/${order.store.slug}/orders/${order.id}`}
                          className="font-mono text-xs hover:underline text-muted-foreground"
                        >
                          #{order.id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{order.customer.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                      </td>
                      <td className="p-4">
                        <Link href={`/${order.store.slug}`} className="hover:underline text-muted-foreground">
                          {order.store.name}
                        </Link>
                      </td>
                      <td className="p-4 text-center">{order._count.items}</td>
                      <td className="p-4 text-right font-medium tabular-nums">{formatPrice(order.total)}</td>
                      <td className="p-4 text-right text-muted-foreground tabular-nums">{formatPrice(order.platformFee)}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {new Date(order.createdAt).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  )
                })}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
