"use client"

import Image from "next/image"
import Link from "next/link"
import { ReactNode } from "react"
import { Package, PanelRightOpen } from "lucide-react"
import { OrderStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { OrderStatusBadge } from "@/components/shared/order-status-badge"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"
import { formatPrice } from "@/lib/utils"
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods"
import { buildTransferReference } from "@/lib/transfer-details"
import { formatVariantSelection } from "@/lib/product-variants"
import { OrderStatusUpdater } from "@/components/dashboard/order-status-updater"
import { RefundButton } from "@/components/dashboard/refund-button"

type CustomerInfo = {
  name?: string
  fullName?: string
  address?: string
  city?: string
  phone?: string
  notes?: string
}

type OrderDetailsItem = {
  id: string
  quantity: number
  unitPrice: number
  total: number
  product: { name: string; images: string[]; slug?: string }
  productSnapshot: unknown
}

export type OrderDetailsSheetOrder = {
  id: string
  status: OrderStatus
  paymentMethod: string
  subtotal: number
  platformFee: number
  discountAmount: number
  total: number
  notes: string | null
  transferCode: string | null
  createdAtLabel: string
  paidAtLabel: string | null
  store: {
    name: string
    slug: string
    transferAccountName: string | null
    transferAccountNumber: string | null
    transferBank: string | null
    transferReferencePrefix: string | null
    transferReferenceExtra: string | null
  }
  customer: {
    name: string | null
    email: string
    phone: string | null
  } | null
  customerEmail: string | null
  customerInfo: CustomerInfo | null
  payment: {
    status: string
    stripePaymentIntentId: string | null
    stripeRefundId: string | null
  } | null
  items: OrderDetailsItem[]
}

export type OrderDetailsSheetProps = {
  order: OrderDetailsSheetOrder
  trigger: ReactNode
  mode?: "admin" | "dashboard"
  storeSlug?: string
}

export function OrderDetailsSheet({ order, trigger, mode = "admin", storeSlug }: OrderDetailsSheetProps) {
  const paymentLabel = PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod
  const transferReference = buildTransferReference(
    order.store.transferReferencePrefix,
    order.store.transferReferenceExtra
  )
  const showDashboardActions = mode === "dashboard" && storeSlug
  const canRefund = showDashboardActions && order.paymentMethod === "STRIPE" && order.payment?.status === "SUCCEEDED"
  const customerName = order.customer?.name ?? order.customerInfo?.fullName ?? order.customerInfo?.name ?? "Sin nombre"
  const customerEmail = order.customer?.email ?? order.customerEmail ?? "Sin correo"
  const customerPhone = order.customer?.phone ?? order.customerInfo?.phone ?? null

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-[92vw] overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="mb-6 pr-8 text-left">
          <SheetTitle className="flex items-center gap-2">
            <PanelRightOpen className="h-4 w-4" />
            Pedido #{order.id.slice(-8).toUpperCase()}
          </SheetTitle>
          <SheetDescription>
            {order.store.name} · {order.createdAtLabel}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <Badge variant="outline">{paymentLabel}</Badge>
            {order.paidAtLabel && <Badge variant="secondary">Pagado {order.paidAtLabel}</Badge>}
          </div>

          {showDashboardActions && (
            <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Acciones</p>
                  <p className="text-sm text-muted-foreground">Cambia el estado o procesa un reembolso.</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/${storeSlug}/orders`}>Ver lista</Link>
                </Button>
              </div>
              <OrderStatusUpdater storeSlug={storeSlug!} orderId={order.id} currentStatus={order.status} />
              {canRefund && <RefundButton storeSlug={storeSlug!} orderId={order.id} />}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold">Productos ({order.items.length})</p>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => {
                const snapshot = item.productSnapshot as { selectedOptions?: Array<{ name: string; value: string }> }
                return (
                  <div key={item.id} className="flex gap-3 rounded-2xl border bg-card p-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <Image
                        src={item.product.images[0] || DEFAULT_PRODUCT_IMAGE}
                        alt={item.product.images[0] ? item.product.name : `Imagen generica de ${item.product.name}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x {formatPrice(item.unitPrice)}
                          </p>
                          {snapshot.selectedOptions?.length ? (
                            <p className="text-xs text-muted-foreground">
                              {formatVariantSelection(snapshot.selectedOptions)}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 font-medium tabular-nums">{formatPrice(item.total)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>Descuento</span>
                <span className="tabular-nums">- {formatPrice(order.discountAmount)}</span>
              </div>
            )}
            {order.platformFee > 0 && (
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>Comision plataforma</span>
                <span className="tabular-nums">{formatPrice(order.platformFee)}</span>
              </div>
            )}
            <Separator className="my-3" />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
              <p className="mt-2 font-medium">{customerName}</p>
              <p className="text-sm text-muted-foreground">{customerEmail}</p>
              {customerPhone && <p className="text-sm text-muted-foreground">{customerPhone}</p>}
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pago</p>
              <p className="mt-2 text-sm text-muted-foreground">{order.payment?.status ?? "Pendiente"}</p>
              {order.payment?.stripePaymentIntentId && (
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{order.payment.stripePaymentIntentId}</p>
              )}
              {order.payment?.stripeRefundId && (
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{order.payment.stripeRefundId}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Datos del cliente</p>
              <div className="mt-2 space-y-1 text-sm">
                {order.customerInfo?.fullName || order.customerInfo?.name ? (
                  <p>{order.customerInfo.fullName ?? order.customerInfo.name}</p>
                ) : null}
                {order.customerInfo?.address && <p className="text-muted-foreground">{order.customerInfo.address}</p>}
                {order.customerInfo?.city && <p className="text-muted-foreground">{order.customerInfo.city}</p>}
                {order.customerInfo?.phone && <p className="text-muted-foreground">{order.customerInfo.phone}</p>}
                {order.customerInfo?.notes && <p className="text-muted-foreground">{order.customerInfo.notes}</p>}
                {!order.customerInfo?.fullName && !order.customerInfo?.name && !order.customerInfo?.address && !order.customerInfo?.city && !order.customerInfo?.phone && !order.customerInfo?.notes && (
                  <p className="text-muted-foreground">Sin informacion disponible</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Transferencia</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {order.transferCode && <p>Código: {order.transferCode}</p>}
                {order.store.transferAccountName && <p>Titular: {order.store.transferAccountName}</p>}
                {order.store.transferBank && <p>Banco: {order.store.transferBank}</p>}
                {order.store.transferAccountNumber && <p>Cuenta: {order.store.transferAccountNumber}</p>}
                {transferReference && <p>Referencia: {transferReference}</p>}
                {!order.transferCode && !order.store.transferAccountName && !order.store.transferAccountNumber && !order.store.transferBank && !transferReference && (
                  <p>Sin datos de transferencia</p>
                )}
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Notas</p>
              <p className="mt-2 text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
