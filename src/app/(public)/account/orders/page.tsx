import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
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
          <p className="mb-4">No tienes pedidos aún.</p>
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
                    <p className="text-sm font-semibold mt-1">{formatPrice(order.total)}</p>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="shrink-0 h-12 w-12 rounded-md bg-muted overflow-hidden">
                      {item.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
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
