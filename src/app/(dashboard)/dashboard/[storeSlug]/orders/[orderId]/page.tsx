import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Package } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { OrderStatusUpdater } from "@/components/dashboard/order-status-updater"
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

type ShippingAddress = {
  name?: string
  address?: string
  city?: string
  phone?: string
  [key: string]: unknown
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; orderId: string }>
}) {
  const { storeSlug, orderId } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const store = await db.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
  if (!store) redirect("/dashboard")

  const order = await db.order.findFirst({
    where: { id: orderId, storeId: store.id, deletedAt: null },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      items: {
        include: { product: { select: { name: true, images: true, slug: true } } },
      },
      payment: { select: { status: true, stripePaymentIntentId: true } },
    },
  })

  if (!order) notFound()

  const shipping = order.shippingAddress as ShippingAddress
  const cfg = statusConfig[order.status]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${storeSlug}/orders`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Pedidos
          </Link>
          <div>
            <h1 className="text-xl font-bold font-mono">#{order.id.slice(-8).toUpperCase()}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleString("es-PE", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <OrderStatusUpdater storeSlug={storeSlug} orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="h-12 w-12 rounded-md bg-muted shrink-0 overflow-hidden">
                      {item.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × S/ {item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium text-sm tabular-nums shrink-0">
                      S/ {item.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="px-6 py-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>S/ {order.subtotal.toFixed(2)}</span>
                </div>
                {order.platformFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Comisión plataforma</span>
                    <span>S/ {order.platformFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base pt-1 border-t">
                  <span>Total</span>
                  <span>S/ {order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas del cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                  {cfg.label}
                </span>
              </div>
              {order.payment && (
                <div className="text-xs text-muted-foreground">
                  <p>Pago: {order.payment.status}</p>
                  {order.payment.stripePaymentIntentId && (
                    <p className="font-mono truncate">{order.payment.stripePaymentIntentId}</p>
                  )}
                </div>
              )}
              {order.paidAt && (
                <p className="text-xs text-muted-foreground">
                  Pagado el{" "}
                  {new Date(order.paidAt).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customer.name ?? "—"}</p>
              <p className="text-muted-foreground">{order.customer.email}</p>
              {order.customer.phone && (
                <p className="text-muted-foreground">{order.customer.phone}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dirección de envío</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-0.5">
              {shipping.name && <p className="font-medium">{shipping.name}</p>}
              {shipping.address && <p className="text-muted-foreground">{shipping.address}</p>}
              {shipping.city && <p className="text-muted-foreground">{shipping.city}</p>}
              {shipping.phone && <p className="text-muted-foreground">{shipping.phone}</p>}
              {!shipping.name && !shipping.address && (
                <p className="text-muted-foreground italic">Sin información de envío</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
