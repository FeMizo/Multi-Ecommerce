import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { subDays, format, eachDayOfInterval } from "date-fns"
import { es } from "date-fns/locale"
import { AdminMetricsCharts } from "@/components/admin/metrics-charts"

export default async function AdminMetricsPage() {
  await requireAdmin()

  const now = new Date()
  const last30 = subDays(now, 30)

  const [topStores, ordersByStatus, dailyOrders] = await Promise.all([
    db.order.groupBy({
      by: ["storeId"],
      where: { status: { in: ["PAID", "DELIVERED"] } },
      _sum: { total: true, platformFee: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
    db.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    db.order.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: last30 }, status: { in: ["PAID", "DELIVERED"] } },
      _sum: { total: true, platformFee: true },
    }),
  ])

  const storeIds = topStores.map((s) => s.storeId)
  const storeNames = await db.store.findMany({
    where: { id: { in: storeIds } },
    select: { id: true, name: true },
  })
  const storeNameMap = new Map(storeNames.map((s) => [s.id, s.name]))

  const topStoresData = topStores.map((s) => ({
    name: storeNameMap.get(s.storeId) ?? s.storeId.slice(0, 8),
    gmv: s._sum.total ?? 0,
    fee: s._sum.platformFee ?? 0,
    orders: s._count.id,
  }))

  const days = eachDayOfInterval({ start: last30, end: now })
  const dayMap = new Map<string, { gmv: number; fee: number }>()
  dailyOrders.forEach((d) => {
    const key = format(new Date(d.createdAt), "yyyy-MM-dd")
    const prev = dayMap.get(key) ?? { gmv: 0, fee: 0 }
    dayMap.set(key, {
      gmv: prev.gmv + (d._sum.total ?? 0),
      fee: prev.fee + (d._sum.platformFee ?? 0),
    })
  })
  const dailyData = days.map((d) => {
    const key = format(d, "yyyy-MM-dd")
    const data = dayMap.get(key) ?? { gmv: 0, fee: 0 }
    return { date: format(d, "dd MMM", { locale: es }), ...data }
  })

  const statusData = ordersByStatus.map((s) => ({
    status: s.status,
    count: s._count.id,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Métricas de plataforma</h1>

      <AdminMetricsCharts dailyData={dailyData} statusData={statusData} />

      <Card>
        <CardHeader><CardTitle>Top 10 tiendas por volumen</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-muted-foreground">#</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Tienda</th>
                <th className="text-right p-4 font-medium text-muted-foreground">GMV</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Fee cobrado</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {topStoresData.map((store, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-4 text-muted-foreground">{i + 1}</td>
                  <td className="p-4 font-medium">{store.name}</td>
                  <td className="p-4 text-right">{formatPrice(store.gmv)}</td>
                  <td className="p-4 text-right">{formatPrice(store.fee)}</td>
                  <td className="p-4 text-center">{store.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
