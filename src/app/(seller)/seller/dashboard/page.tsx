import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, DollarSign, Package, Star, TrendingUp } from "lucide-react"
import { SellerMetricsChart } from "@/components/seller/metrics-chart"

async function getSellerStats(sellerId: string) {
  const [orders, products, totalRevenue, pendingOrders] = await Promise.all([
    db.order.findMany({
      where: { sellerId },
      include: { items: true, buyer: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.product.count({ where: { sellerId, status: "ACTIVE" } }),
    db.order.aggregate({
      where: { sellerId, status: { in: ["PAID", "DELIVERED"] } },
      _sum: { subtotal: true },
    }),
    db.order.count({ where: { sellerId, status: "PAID" } }),
  ])

  const last30Days = new Date()
  last30Days.setDate(last30Days.getDate() - 30)

  const revenueByDay = await db.order.groupBy({
    by: ["createdAt"],
    where: { sellerId, createdAt: { gte: last30Days }, status: { in: ["PAID", "DELIVERED"] } },
    _sum: { subtotal: true },
  })

  return { orders, products, totalRevenue: totalRevenue._sum.subtotal ?? 0, pendingOrders, revenueByDay }
}

export default async function SellerDashboardPage() {
  const session = await auth()
  const seller = await db.seller.findUnique({ where: { userId: session!.user.id } })
  if (!seller) redirect("/seller/register")

  const stats = await getSellerStats(seller.id)

  const statCards = [
    { title: "Ingresos totales", value: formatPrice(stats.totalRevenue), icon: DollarSign, desc: "Comisión descontada" },
    { title: "Pedidos pendientes", value: stats.pendingOrders, icon: ShoppingBag, desc: "Por procesar" },
    { title: "Productos activos", value: stats.products, icon: Package, desc: "En tu tienda" },
    { title: "Calificación", value: `${seller.rating.toFixed(1)} ⭐`, icon: Star, desc: "Promedio de reseñas" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">{seller.businessName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ title, value, icon: Icon, desc }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ventas últimos 30 días
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SellerMetricsChart data={stats.revenueByDay} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Últimos pedidos</CardTitle></CardHeader>
        <CardContent>
          {stats.orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin pedidos aún</p>
          ) : (
            <div className="space-y-3">
              {stats.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{order.buyer.name}</p>
                    <p className="text-xs text-muted-foreground">{order.items.length} producto(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(order.total)}</p>
                    <Badge variant={order.status === "PAID" ? "default" : "secondary"} className="text-xs">
                      {order.status}
                    </Badge>
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
