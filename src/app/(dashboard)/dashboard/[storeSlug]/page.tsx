import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Package, ShoppingBag, DollarSign, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

async function getStoreMetrics(storeId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalProducts,
    activeProducts,
    totalOrders,
    ordersThisMonth,
    revenueResult,
    revenueThisMonth,
    recentOrders,
  ] = await Promise.all([
    db.product.count({ where: { storeId, deletedAt: null } }),
    db.product.count({ where: { storeId, status: "ACTIVE", deletedAt: null } }),
    db.order.count({ where: { storeId } }),
    db.order.count({ where: { storeId, createdAt: { gte: startOfMonth } } }),
    db.order.aggregate({
      where: { storeId, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      _sum: { total: true },
    }),
    db.order.aggregate({
      where: {
        storeId,
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    }),
    db.order.findMany({
      where: { storeId },
      include: {
        customer: { select: { name: true, email: true } },
        items: { select: { quantity: true, unitPrice: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    ordersThisMonth,
    totalRevenue: revenueResult._sum.total ?? 0,
    revenueThisMonth: revenueThisMonth._sum.total ?? 0,
    recentOrders,
  }
}

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "Pagado", className: "bg-green-100 text-green-800" },
  PROCESSING: { label: "Procesando", className: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "Enviado", className: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "Entregado", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Reembolsado", className: "bg-gray-100 text-gray-800" },
}

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true, name: true },
  })
  if (!store) redirect("/dashboard")

  const metrics = await getStoreMetrics(store.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{store.name}</h1>
        <p className="text-sm text-muted-foreground">Panel de control</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(metrics.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPrice(metrics.revenueThisMonth)} este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.ordersThisMonth} este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.totalProducts}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.activeProducts} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {metrics.totalOrders > 0
                ? formatPrice(metrics.totalRevenue / metrics.totalOrders)
                : formatPrice(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">por pedido</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aún no hay pedidos
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {order.customer.name ?? order.customer.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} producto{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusLabels[order.status]?.className ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[order.status]?.label ?? order.status}
                    </span>
                    <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
