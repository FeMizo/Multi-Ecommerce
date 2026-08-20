import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Package } from "lucide-react"
import Image from "next/image"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { OrderStatusUpdater } from "@/components/dashboard/order-status-updater"
import { OrderStatusBadge } from "@/components/shared/order-status-badge"
import { RefundButton } from "@/components/dashboard/refund-button"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods"
import { buildTransferReference } from "@/lib/transfer-details"
import { formatVariantSelection } from "@/lib/product-variants"
import { DELIVERY_STATUS_LABELS, formatDeliveryMethodLabel, buildGoogleMapsSearchUrl } from "@/lib/delivery"
import { AdminUnassignDriverButton } from "@/components/orders/admin-unassign-driver-button"

type CustomerInfo = {
  name?: string
  fullName?: string
  address?: string
  city?: string
  phone?: string
  notes?: string
  [key: string]: unknown
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  await requireAdmin()

  const order = await db.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      items: {
        include: { product: { select: { name: true, images: true, slug: true } } },
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
      delivery: {
        select: {
          status: true,
          method: true,
          formattedAddress: true,
          lat: true,
          lng: true,
          notes: true,
          driver: {
            select: {
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
  })

  if (!order) notFound()

  const customerInfo = order.customerInfo as CustomerInfo
  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod
  const transferReference = buildTransferReference(order.store.transferReferencePrefix, order.store.transferReferenceExtra)
  const mapsUrl = order.delivery
    ? buildGoogleMapsSearchUrl({
        formattedAddress: order.delivery.formattedAddress,
        lat: order.delivery.lat,
        lng: order.delivery.lng,
      })
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Pedidos
          </Link>
          <div>
            <h1 className="text-xl font-bold font-mono">#{order.id.slice(-8).toUpperCase()}</h1>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleString("es-MX", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <OrderStatusUpdater
          key={`${order.id}-${order.status}`}
          storeSlug={order.store.slug}
          orderId={order.id}
          currentStatus={order.status}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      <Image
                        src={item.product.images[0] || DEFAULT_PRODUCT_IMAGE}
                        alt={item.product.images[0] ? item.product.name : `Imagen generica de ${item.product.name}`}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatPrice(item.unitPrice)}
                      </p>
                      {(() => {
                        const snapshot = item.productSnapshot as { selectedOptions?: Array<{ name: string; value: string }> }
                        return snapshot.selectedOptions?.length ? (
                          <p className="text-xs text-muted-foreground">
                            {formatVariantSelection(snapshot.selectedOptions)}
                          </p>
                        ) : null
                      })()}
                    </div>
                    <p className="font-medium text-sm tabular-nums shrink-0">
                      {formatPrice(item.total)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="px-6 py-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.platformFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Comisión plataforma</span>
                    <span>{formatPrice(order.platformFee)}</span>
                  </div>
                )}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Descuento</span>
                    <span>- {formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base pt-1 border-t">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p className="font-mono text-foreground">#{order.id}</p>
              <p>Creado: {new Date(order.createdAt).toLocaleString("es-MX")}</p>
              {order.paidAt && <p>Pagado: {new Date(order.paidAt).toLocaleString("es-MX")}</p>}
              {order.couponCode && <p>Cupón: {order.couponCode}</p>}
              {order.coupon && <p>Promoción: {order.coupon.name}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <OrderStatusBadge status={order.status} />
              {order.payment && (
                <div className="text-xs text-muted-foreground">
                  <p>Pago: {order.payment.status}</p>
                  <p>{paymentLabel}</p>
                  {order.payment.stripePaymentIntentId && (
                    <p className="font-mono truncate">{order.payment.stripePaymentIntentId}</p>
                  )}
                  {order.paymentMethod === "TRANSFER" && order.transferCode && (
                    <p className="font-mono truncate">Código: {order.transferCode}</p>
                  )}
                </div>
              )}
              {order.paymentMethod === "STRIPE" && order.payment?.status === "SUCCEEDED" && (
                <RefundButton storeSlug={order.store.slug} orderId={order.id} />
              )}
              {order.paymentMethod === "TRANSFER" && (
                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                  {order.store.transferAccountName && <p><span className="text-foreground">Titular:</span> {order.store.transferAccountName}</p>}
                  {order.store.transferBank && <p><span className="text-foreground">Banco:</span> {order.store.transferBank}</p>}
                  {order.store.transferAccountNumber && <p><span className="text-foreground">Cuenta:</span> {order.store.transferAccountNumber}</p>}
                  {transferReference && (
                    <p><span className="text-foreground">Referencia:</span> {transferReference}</p>
                  )}
                </div>
              )}
              {order.paidAt && (
                <p className="text-xs text-muted-foreground">
                  Pagado el{" "}
                  {new Date(order.paidAt).toLocaleDateString("es-MX", {
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
              <p className="font-medium">{order.customer?.name ?? customerInfo.name ?? "—"}</p>
              <p className="text-muted-foreground">{order.customer?.email ?? order.customerEmail}</p>
              {(order.customer?.phone ?? customerInfo.phone) && (
                <p className="text-muted-foreground">{order.customer?.phone ?? customerInfo.phone}</p>
              )}
            </CardContent>
          </Card>

          {order.delivery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {DELIVERY_STATUS_LABELS[order.delivery.status as keyof typeof DELIVERY_STATUS_LABELS] ?? order.delivery.status}
                  </Badge>
                  <Badge variant="secondary">{formatDeliveryMethodLabel(order.delivery.method)}</Badge>
                </div>
                <div className="space-y-1">
                  {order.delivery.formattedAddress ? (
                    <p className="text-muted-foreground">{order.delivery.formattedAddress}</p>
                  ) : (
                    <p className="text-muted-foreground">Sin dirección registrada</p>
                  )}
                  {order.delivery.lat !== null && order.delivery.lng !== null && (
                    <p className="font-mono text-xs text-muted-foreground">
                      {order.delivery.lat.toFixed(6)}, {order.delivery.lng.toFixed(6)}
                    </p>
                  )}
                </div>
                {mapsUrl && (
                  <Button asChild variant="outline" size="sm" className="w-fit">
                    <a href={mapsUrl} target="_blank" rel="noreferrer">
                      Abrir en Google Maps
                    </a>
                  </Button>
                )}
                {order.delivery.notes && (
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
                    <p className="text-xs font-medium text-foreground">Contexto adicional</p>
                    <p className="text-xs text-muted-foreground">{order.delivery.notes}</p>
                  </div>
                )}
                {order.delivery.driver && (
                  <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">Repartidor asignado</p>
                      <p className="text-muted-foreground">{order.delivery.driver.name}</p>
                    </div>
                    {order.delivery.driver.phone && <p className="text-muted-foreground">{order.delivery.driver.phone}</p>}
                    <AdminUnassignDriverButton orderId={order.id} />
                  </div>
                )}
                {!order.delivery.driver && (
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs font-medium text-foreground">Sin repartidor asignado</p>
                    <p className="text-xs text-muted-foreground">Este pedido aparece como pendiente en Delivery.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-0.5">
              {customerInfo.name && <p className="font-medium">{customerInfo.name}</p>}
              {customerInfo.address && <p className="text-muted-foreground">{customerInfo.address}</p>}
              {customerInfo.city && <p className="text-muted-foreground">{customerInfo.city}</p>}
              {customerInfo.phone && <p className="text-muted-foreground">{customerInfo.phone}</p>}
              {!customerInfo.name && !customerInfo.address && !customerInfo.city && !customerInfo.phone && (
                <p className="text-muted-foreground italic">Sin información disponible</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
