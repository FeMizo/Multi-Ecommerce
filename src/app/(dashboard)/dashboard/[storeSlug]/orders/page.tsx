import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { OrderStatusBadge, ORDER_STATUS_LABELS } from "@/components/shared/order-status-badge"
import { OrderStatus } from "@prisma/client"

const ALL_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]

type Params = { storeSlug: string }
type SearchParams = { status?: string; page?: string }

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { storeSlug } = await params
  const { status, page } = await searchParams
  const session = await auth()
  if (!session?.user) redirect("/login")

  const store = await db.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
  if (!store) redirect("/dashboard")

  const take = 20
  const currentPage = Number(page ?? 1)
  const skip = (currentPage - 1) * take

  const statusFilter = status && ALL_STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined

  const where = { storeId: store.id, deletedAt: null, ...(statusFilter ? { status: statusFilter } : {}) }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.order.count({ where }),
  ])

  const pages = Math.ceil(total / take)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { status, page, ...overrides }
    if (merged.status) p.set("status", merged.status)
    if (merged.page && merged.page !== "1") p.set("page", merged.page)
    const qs = p.toString()
    return `/dashboard/${storeSlug}/orders${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{total} pedido{total !== 1 ? "s" : ""} en total</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Button asChild variant={!statusFilter ? "default" : "outline"} size="sm" className="rounded-full shrink-0">
          <Link href={buildUrl({ status: undefined, page: undefined })}>Todos</Link>
        </Button>
        {ALL_STATUSES.map((s) => (
          <Button key={s} asChild variant={statusFilter === s ? "default" : "outline"} size="sm" className="rounded-full shrink-0">
            <Link href={buildUrl({ status: s, page: undefined })}>{ORDER_STATUS_LABELS[s]}</Link>
          </Button>
        ))}
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border rounded-lg">
          <p className="font-medium">No hay pedidos{statusFilter ? ` con estado "${ORDER_STATUS_LABELS[statusFilter]}"` : ""}</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Pedido</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Cliente</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Items</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="font-medium leading-tight">{order.customer.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{order.customer.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {order._count.items}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/${storeSlug}/orders/${order.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button key={p} asChild variant={p === currentPage ? "default" : "outline"} size="sm" className="h-9 w-9 p-0">
              <Link href={buildUrl({ page: p === 1 ? undefined : String(p) })}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
