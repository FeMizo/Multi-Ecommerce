import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { CheckCircle2, Package } from "lucide-react"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { OrderStatusBadge } from "@/components/shared/order-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods"
import { formatVariantSelection } from "@/lib/product-variants"
import { buildTransferReference } from "@/lib/transfer-details"

type SearchParams = { id?: string }

export default async function PublicOrderPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { id } = await searchParams

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Consulta tu pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Abre el enlace que recibiste por correo para ver el estado y detalle de tu pedido.
            </p>
            <Button asChild>
              <Link href="/search">Seguir comprando</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const order = await db.order.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { id },
        { id: { endsWith: id.toLowerCase() } },
        { id: { endsWith: id.toUpperCase() } },
      ],
    },
    include: {
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
      customer: { select: { name: true, email: true, phone: true } },
      items: {
        include: { product: { select: { name: true, images: true, slug: true } } },
      },
      payment: { select: { status: true, stripePaymentIntentId: true, stripeRefundId: true } },
      delivery: {
        select: {
          status: true,
          method: true,
          formattedAddress: true,
          notes: true,
          driver: {
            select: {
              name: true,
              status: true,
            },
          },
        },
      },
    },
  })

  if (!order) notFound()

  const customerInfo = order.customerInfo as {
    fullName?: string
    name?: string
    address?: string
    city?: string
    phone?: string
    notes?: string
  }
  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod
  const transferReference = buildTransferReference(order.store.transferReferencePrefix, order.store.transferReferenceExtra)

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pedido #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-muted-foreground">{order.store.name}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <Badge variant="outline">{paymentLabel}</Badge>
        {order.transferCode && <Badge variant="secondary">Código {order.transferCode}</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Estado del pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {order.status === "PENDING_PAYMENT" && "Tu pedido está pendiente de pago."}
                {order.status === "AWAITING_CONFIRMATION" && "Tu pedido espera confirmación del vendedor."}
                {order.status === "PENDING" && "Tu pedido fue registrado."}
                {order.status === "PAID" && "Tu pago fue confirmado."}
                {order.status === "PROCESSING" && "Tu pedido está siendo preparado."}
                {order.status === "SHIPPED" && "Tu pedido ya fue enviado."}
                {order.status === "DELIVERED" && "Tu pedido fue entregado."}
                {order.status === "CANCELLED" && "Tu pedido fue cancelado."}
                {order.status === "REFUNDED" && "Tu pago fue reembolsado."}
              </p>
              {order.paidAt && <p className="text-xs text-muted-foreground">Pagado el {new Date(order.paidAt).toLocaleString("es-MX")}</p>}
              {order.payment?.status && <p className="text-xs text-muted-foreground">Pago: {order.payment.status}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Productos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {order.items.map((item) => {
                  const snapshot = item.productSnapshot as { selectedOptions?: Array<{ name: string; value: string }> }
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-6 py-4">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={item.product.images[0] || DEFAULT_PRODUCT_IMAGE}
                          alt={item.product.images[0] ? item.product.name : `Imagen generica de ${item.product.name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x {formatPrice(item.unitPrice)}
                        </p>
                        {snapshot.selectedOptions?.length ? (
                          <p className="text-xs text-muted-foreground">{formatVariantSelection(snapshot.selectedOptions)}</p>
                        ) : null}
                      </div>
                      <p className="shrink-0 font-medium tabular-nums">{formatPrice(item.total)}</p>
                    </div>
                  )
                })}
              </div>
              <div className="border-t px-6 py-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Descuento</span>
                    <span>- {formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                {order.platformFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Comision plataforma</span>
                    <span>{formatPrice(order.platformFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base pt-1 border-t">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacto</CardTitle>
            </CardHeader>
          <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customer?.name ?? customerInfo.fullName ?? customerInfo.name ?? "Sin nombre"}</p>
              <p className="text-muted-foreground">{order.customer?.email ?? order.customerEmail}</p>
              {(order.customer?.phone ?? customerInfo.phone) && <p className="text-muted-foreground">{order.customer?.phone ?? customerInfo.phone}</p>}
              {customerInfo.address && <p className="text-muted-foreground">{customerInfo.address}</p>}
              {customerInfo.city && <p className="text-muted-foreground">{customerInfo.city}</p>}
              {customerInfo.notes && <p className="text-muted-foreground">{customerInfo.notes}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {order.payment?.status && <p className="text-muted-foreground">Estado: {order.payment.status}</p>}
              {order.payment?.stripePaymentIntentId && <p className="truncate font-mono text-xs text-muted-foreground">{order.payment.stripePaymentIntentId}</p>}
              {order.payment?.stripeRefundId && <p className="truncate font-mono text-xs text-muted-foreground">{order.payment.stripeRefundId}</p>}
              {order.transferCode && <p className="font-mono text-xs text-muted-foreground">Código: {order.transferCode}</p>}
            </CardContent>
          </Card>

          {order.delivery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-muted-foreground">Estado: {order.delivery.status}</p>
                <p className="text-muted-foreground">Método: {order.delivery.method}</p>
                {order.delivery.formattedAddress && <p className="text-muted-foreground">{order.delivery.formattedAddress}</p>}
                {order.delivery.notes && <p className="text-muted-foreground">{order.delivery.notes}</p>}
                {order.delivery.driver && <p className="text-muted-foreground">Repartidor: {order.delivery.driver.name}</p>}
              </CardContent>
            </Card>
          )}

          {(order.store.transferAccountName || order.store.transferAccountNumber || order.store.transferBank || transferReference) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transferencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {order.store.transferAccountName && <p>Titular: {order.store.transferAccountName}</p>}
                {order.store.transferBank && <p>Banco: {order.store.transferBank}</p>}
                {order.store.transferAccountNumber && <p>Cuenta: {order.store.transferAccountNumber}</p>}
                {transferReference && <p>Referencia: {transferReference}</p>}
              </CardContent>
            </Card>
          )}

          <Button asChild className="w-full">
            <Link href={`/${order.store.slug}`}>Ver tienda</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
