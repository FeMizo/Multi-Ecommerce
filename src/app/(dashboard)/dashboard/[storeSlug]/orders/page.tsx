import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { OrderStatus } from "@prisma/client"

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "Pagado", className: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Procesando", className: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", className: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Entregado", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Reembolsado", className: "bg-gray-100 text-gray-800" },
}

const ALL_STATUSES = Object.keys(statusConfig) as OrderStatus[]

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
        <Link
          href={buildUrl({ status: undefined, page: undefined })}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition-colors ${
            !statusFilter ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent border-input"
          }`}
        >
          Todos
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildUrl({ status: s, page: undefined })}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent border-input"
            }`}
          >
            {statusConfig[s].label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border rounded-lg">
          <p className="font-medium">No hay pedidos{statusFilter ? ` con estado "${statusConfig[statusFilter].label}"` : ""}</p>
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
              {orders.map((order) => {
                const cfg = statusConfig[order.status]
                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="font-medium leading-tight">{order.customer.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{order.customer.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {order._count.items}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      S/ {order.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={buildUrl({ page: p === 1 ? undefined : String(p) })}
              className={`h-9 w-9 flex items-center justify-center rounded-md border text-sm ${
                p === currentPage ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
