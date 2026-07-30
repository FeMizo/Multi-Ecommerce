import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/placeholders"
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods"
import { formatVariantSelection } from "@/lib/product-variants"
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-status"

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: ORDER_STATUS_LABELS.PENDING_PAYMENT, className: "bg-yellow-100 text-yellow-800" },
  AWAITING_CONFIRMATION: { label: ORDER_STATUS_LABELS.AWAITING_CONFIRMATION, className: "bg-amber-100 text-amber-800" },
  PENDING: { label: ORDER_STATUS_LABELS.PENDING, className: "bg-yellow-100 text-yellow-800" },
  PAID: { label: ORDER_STATUS_LABELS.PAID, className: "bg-green-100 text-green-800" },
  PROCESSING: { label: ORDER_STATUS_LABELS.PROCESSING, className: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: ORDER_STATUS_LABELS.SHIPPED, className: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: ORDER_STATUS_LABELS.DELIVERED, className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: ORDER_STATUS_LABELS.CANCELLED, className: "bg-red-100 text-red-800" },
  REFUNDED: { label: ORDER_STATUS_LABELS.REFUNDED, className: "bg-gray-100 text-gray-800" },
}

export default async function AccountOrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const orders = await db.order.findMany({
    where: { customerId: session.user.id, deletedAt: null },
    include: {
      store: { select: { name: true, slug: true } },
      items: {
        include: { product: { select: { name: true, images: true } } },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Mis Pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">No tienes pedidos aun.</p>
          <Link href="/" className="text-primary underline underline-offset-4">
            Explorar tiendas
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const cfg = statusConfig[order.status]
            return (
              <div key={order.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-mono text-sm font-semibold">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.store.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
                      {cfg.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? order.paymentMethod}
                    </p>
                    {order.paymentMethod === "TRANSFER" && order.transferCode && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        Codigo {order.transferCode}
                      </p>
                    )}
                    <p className="text-sm font-semibold mt-1">{formatPrice(order.total)}</p>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="shrink-0">
                      <div className="h-12 w-12 rounded-md bg-muted overflow-hidden">
                        <Image
                          src={item.product.images[0] || DEFAULT_PRODUCT_IMAGE}
                          alt={item.product.images[0] ? item.product.name : `Imagen generica de ${item.product.name}`}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {(() => {
                        const snapshot = item.productSnapshot as { selectedOptions?: Array<{ name: string; value: string }> }
                        return snapshot.selectedOptions?.length ? (
                          <p className="mt-1 w-12 text-[10px] leading-tight text-muted-foreground">
                            {formatVariantSelection(snapshot.selectedOptions)}
                          </p>
                        ) : null
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
