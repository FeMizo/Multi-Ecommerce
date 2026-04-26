import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, Package, DollarSign, TrendingUp, ShoppingBag } from "lucide-react"
import { AdminRevenueChart } from "@/components/admin/revenue-chart"

async function getAdminStats() {
  const [totalUsers, totalStores, totalProducts, totalOrders, revenue, recentOrders] = await Promise.all([
    db.user.count(),
    db.store.count({ where: { isActive: true } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.order.count(),
    db.order.aggregate({
      where: { status: { in: ["PAID", "DELIVERED"] } },
      _sum: { platformFee: true, total: true },
    }),
    db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        store: { select: { name: true } },
      },
    }),
  ])

  const last30 = new Date()
  last30.setDate(last30.getDate() - 30)
  const revenueByDay = await db.order.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: last30 }, status: { in: ["PAID", "DELIVERED"] } },
    _sum: { platformFee: true },
  })

  return {
    totalUsers,
    totalStores,
    totalProducts,
    totalOrders,
    totalRevenue: revenue._sum.total ?? 0,
    platformRevenue: revenue._sum.platformFee ?? 0,
    recentOrders,
    revenueByDay,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats()

  const cards = [
    { title: "Usuarios", value: stats.totalUsers, icon: Users, desc: "Total registrados" },
    { title: "Tiendas activas", value: stats.totalStores, icon: Store, desc: "" },
    { title: "Productos activos", value: stats.totalProducts, icon: Package, desc: "" },
    { title: "Total pedidos", value: stats.totalOrders, icon: ShoppingBag, desc: "" },
    { title: "Volumen total", value: formatPrice(stats.totalRevenue), icon: TrendingUp, desc: "" },
    { title: "Revenue plataforma", value: formatPrice(stats.platformRevenue), icon: DollarSign, desc: "Comisiones cobradas" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ title, value, icon: Icon, desc }) => (
          <Card key={title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{title}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                  {desc && <p className="text-xs text-muted-foreground mt-1">{desc}</p>}
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Revenue de plataforma · Últimos 30 días</CardTitle></CardHeader>
        <CardContent>
          <AdminRevenueChart data={stats.revenueByDay} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Últimos pedidos</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                <div>
                  <p className="font-medium">{order.customer.name} → {order.store.name}</p>
                  <p className="text-muted-foreground text-xs">{new Date(order.createdAt).toLocaleDateString("es-MX")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(order.total)}</p>
                  <p className="text-xs text-muted-foreground">Fee: {formatPrice(order.platformFee)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
