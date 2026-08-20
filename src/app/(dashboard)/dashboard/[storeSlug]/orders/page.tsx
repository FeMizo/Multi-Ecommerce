import { redirect } from "next/navigation"
import Link from "next/link"
import { OrderStatusUpdater } from "@/components/dashboard/order-status-updater"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEffectivePlan } from "@/lib/plan-limits"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ORDER_STATUS_LABELS } from "@/components/shared/order-status-badge"
import { type OrderStatus } from "@/lib/order-status"
import { OrderDetailsSheetButton, type OrderDetailsSheetOrder } from "@/components/orders/order-details-sheet-client"

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
  if (!await getEffectivePlan(store.id)) redirect(`/dashboard/${storeSlug}/planes?billing=required`)

  const take = 20
  const currentPage = Number(page ?? 1)
  const skip = (currentPage - 1) * take

  const statusFilter = status && ALL_STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined

  const where = { storeId: store.id, deletedAt: null, ...(statusFilter ? { status: statusFilter } : {}) }

  const [orders, total, drivers] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            total: true,
            productSnapshot: true,
            product: { select: { name: true, images: true, slug: true } },
          },
        },
        payment: { select: { status: true, stripePaymentIntentId: true, stripeRefundId: true } },
        coupon: {
          select: {
            code: true,
            name: true,
            type: true,
            value: true,
          },
        },
        delivery: {
          select: {
            id: true,
            driverId: true,
            status: true,
            method: true,
            formattedAddress: true,
            lat: true,
            lng: true,
            notes: true,
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
                plate: true,
                licenseNumber: true,
                status: true,
              },
            },
          },
        },
        store: {
          select: {
            name: true,
            slug: true,
            transferAccountName: true,
            transferAccountNumber: true,
            transferBank: true,
            transferReferencePrefix: true,
            transferReferenceExtra: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.order.count({ where }),
    db.driver.findMany({
      where: {
        OR: [{ storeId: store.id }, { storeId: null }],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        plate: true,
        licenseNumber: true,
        status: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  const pages = Math.ceil(total / take)

  const orderDetails = (order: Awaited<typeof orders>[number]): OrderDetailsSheetOrder => ({
    id: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    platformFee: order.platformFee,
    discountAmount: order.discountAmount,
    total: order.total,
    couponCode: order.couponCode,
    coupon: order.coupon
      ? {
          code: order.coupon.code,
          name: order.coupon.name,
          type: order.coupon.type,
          value: order.coupon.value,
        }
      : null,
    notes: order.notes,
    transferCode: order.transferCode,
    createdAtLabel: new Date(order.createdAt).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    paidAtLabel: order.paidAt
      ? new Date(order.paidAt).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null,
    store: order.store,
    customer: order.customer ? order.customer : null,
    customerEmail: order.customerEmail,
    customerInfo: order.customerInfo as OrderDetailsSheetOrder["customerInfo"],
    payment: order.payment,
    delivery: order.delivery,
    items: order.items,
  })

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
        <div className="border rounded-lg overflow-x-auto overflow-hidden">
          <table className="min-w-max w-full whitespace-nowrap text-sm">
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
                    <div className="font-medium leading-tight">{order.customer?.name ?? order.customerEmail}</div>
                    <div className="text-xs text-muted-foreground">{order.customer?.email ?? order.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {order.items.length}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusUpdater
                      key={`${order.id}-${order.status}`}
                      storeSlug={storeSlug}
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <OrderDetailsSheetButton
                      mode="dashboard"
                      storeSlug={storeSlug}
                      order={orderDetails(order)}
                      drivers={drivers}
                    />
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
