import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { subDays, format, eachDayOfInterval } from "date-fns"
import { es } from "date-fns/locale"
import { AdminMetricsCharts } from "@/components/admin/metrics-charts"
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods"

type SubscriptionPlanSummary = {
  id: string
  name: string
  total: number
  trialing: number
  active: number
  past_due: number
  cancelled: number
  unpaid: number
}

export default async function AdminMetricsPage() {
  await requireAdmin()

  const now = new Date()
  const last30 = subDays(now, 30)

  const [
    topStores,
    ordersByStatus,
    dailyOrders,
    totalUsers,
    totalOrders,
    ordersByPaymentMethod,
    totalProducts,
    activeProducts,
    whatsappOrders,
    subscriptions,
  ] = await Promise.all([
    db.order.groupBy({
      by: ["storeId"],
      where: { deletedAt: null, status: { in: ["PAID", "DELIVERED"] } },
      _sum: { total: true, platformFee: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    }),
    db.order.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    db.order.groupBy({
      by: ["createdAt"],
      where: { deletedAt: null, createdAt: { gte: last30 }, status: { in: ["PAID", "DELIVERED"] } },
      _sum: { total: true, platformFee: true },
    }),
    db.user.count(),
    db.order.count({ where: { deletedAt: null } }),
    db.order.groupBy({
      by: ["paymentMethod"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
    db.product.count(),
    db.product.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.order.count({ where: { deletedAt: null, whatsappNotifiedAt: { not: null } } }),
    db.storeSubscription.findMany({
      select: {
        status: true,
        plan: { select: { id: true, name: true } },
      },
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

  const paymentMethodOrder = ["STRIPE", "CASH_ON_DELIVERY", "TRANSFER"] as const
  const paymentMethodMap = new Map(ordersByPaymentMethod.map((entry) => [entry.paymentMethod, entry._count.id]))
  const paymentData = paymentMethodOrder.map((method) => ({
    method: PAYMENT_METHOD_LABELS[method],
    count: paymentMethodMap.get(method) ?? 0,
  }))

  const planMap = new Map<string, SubscriptionPlanSummary>()
  for (const subscription of subscriptions) {
    if (!subscription.plan) continue
    const current = planMap.get(subscription.plan.id) ?? {
      id: subscription.plan.id,
      name: subscription.plan.name,
      total: 0,
      trialing: 0,
      active: 0,
      past_due: 0,
      cancelled: 0,
      unpaid: 0,
    }
    current.total += 1
    if (subscription.status === "TRIALING") current.trialing += 1
    if (subscription.status === "ACTIVE") current.active += 1
    if (subscription.status === "PAST_DUE") current.past_due += 1
    if (subscription.status === "CANCELLED") current.cancelled += 1
    if (subscription.status === "UNPAID") current.unpaid += 1
    planMap.set(subscription.plan.id, current)
  }
  const planData = [...planMap.values()].sort((a, b) => b.total - a.total)

  const metrics = [
    { title: "Cuentas creadas", value: totalUsers, desc: "Usuarios registrados" },
    { title: "Pedidos creados", value: totalOrders, desc: "Pedidos totales" },
    { title: "Avisos WhatsApp", value: whatsappOrders, desc: "Pedidos notificados por WhatsApp" },
    { title: "Productos activos", value: activeProducts, desc: "Productos visibles" },
    { title: "Productos creados", value: totalProducts, desc: "Todos los productos" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Metricas de plataforma</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="text-2xl font-bold mt-1">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminMetricsCharts dailyData={dailyData} statusData={statusData} paymentData={paymentData} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Tipos de plan</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-max w-full whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Activo</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Prueba</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Vencido</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Cancelado</th>
                </tr>
              </thead>
              <tbody>
                {planData.length ? planData.map((plan) => (
                  <tr key={plan.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="p-4 font-medium">{plan.name}</td>
                    <td className="p-4 text-center">{plan.total}</td>
                    <td className="p-4 text-center">{plan.active}</td>
                    <td className="p-4 text-center">{plan.trialing}</td>
                    <td className="p-4 text-center">{plan.past_due}</td>
                    <td className="p-4 text-center">{plan.cancelled}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={6}>Sin suscripciones</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top 10 tiendas por volumen</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-max w-full whitespace-nowrap text-sm">
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
    </div>
  )
}
