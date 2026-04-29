import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { AdminSearch } from "@/components/admin/admin-search"
import { OrderStatusBadge, ORDER_STATUS_LABELS } from "@/components/shared/order-status-badge"
import { OrderStatus } from "@prisma/client"
import Link from "next/link"

const ALL_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]

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
        <Button asChild variant={!status ? "default" : "outline"} size="sm" className="rounded-full">
          <Link href={buildHref()}>Todos</Link>
        </Button>
        {ALL_STATUSES.map((s) => (
          <Button key={s} asChild variant={status === s ? "default" : "outline"} size="sm" className="rounded-full">
            <Link href={buildHref(s)}>{ORDER_STATUS_LABELS[s]}</Link>
          </Button>
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
                {orders.map((order) => (
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
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
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
