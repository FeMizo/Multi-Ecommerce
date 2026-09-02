import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { AdminSearch } from "@/components/admin/admin-search"
import { OrderStatusBadge, ORDER_STATUS_LABELS } from "@/components/shared/order-status-badge"
import type { OrderStatus } from "@/lib/order-status"
import Link from "next/link"
import { OrderDetailsSheetButton, type OrderDetailsSheetOrder } from "@/components/orders/order-details-sheet-client"

const ALL_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]

type SearchParams = { q?: string; status?: string; page?: string }

type AdminOrder = Omit<OrderDetailsSheetOrder, "createdAtLabel" | "paidAtLabel" | "store"> & {
  createdAt: Date
  paidAt: Date | null
  store: OrderDetailsSheetOrder["store"] & { id: string }
}

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
        { customerEmail: { contains: q, mode: "insensitive" as const } },
        { store: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    } : {}),
  }

  const [orders, total, drivers] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            transferAccountName: true,
            transferAccountNumber: true,
            transferBank: true,
            transferReferencePrefix: true,
            transferReferenceExtra: true,
          },
        },
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
      },
    }),
    db.order.count({ where }),
    db.driver.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        plate: true,
        licenseNumber: true,
        status: true,
        storeId: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  const typedOrders = orders as AdminOrder[]

  const buildHref = (s?: string) => {
    const params = new URLSearchParams()
    if (s) params.set("status", s)
    if (q) params.set("q", q)
    return `/admin/orders${params.size ? `?${params}` : ""}`
  }

  const orderDetails = (order: AdminOrder): OrderDetailsSheetOrder => ({
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

  const driversForOrder = (storeId: string) =>
    drivers
      .filter((driver) => driver.storeId === null || driver.storeId === storeId)
      .map((driver) => ({
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        plate: driver.plate,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
      }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className="flex flex-wrap items-center gap-3">
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
            <table className="min-w-max w-full whitespace-nowrap text-sm">
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
                  <th className="text-right p-4 font-medium text-muted-foreground">Abrir</th>
                </tr>
              </thead>
              <tbody>
                {typedOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="p-4">
                      <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{order.customer?.name ?? order.customerEmail}</p>
                      <p className="text-xs text-muted-foreground">{order.customer?.email ?? order.customerEmail}</p>
                    </td>
                    <td className="p-4">
                      <Link href={`/${order.store.slug}`} className="hover:underline text-muted-foreground">
                        {order.store.name}
                      </Link>
                    </td>
                    <td className="p-4 text-center">{order.items.length}</td>
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
                    <td className="p-4 text-right">
                      <OrderDetailsSheetButton
                        mode="admin"
                        order={orderDetails(order)}
                        drivers={driversForOrder(order.store.id)}
                      />
                    </td>
                  </tr>
                ))}
                {typedOrders.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
