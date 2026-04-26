import { redirect } from "next/navigation"
import { subDays, format, eachDayOfInterval } from "date-fns"
import { es } from "date-fns/locale"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { MetricsCharts } from "@/components/dashboard/metrics-charts"

export default async function MetricsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const store = await db.store.findUnique({ where: { slug: storeSlug }, select: { id: true } })
  if (!store) redirect("/dashboard")

  const now = new Date()
  const thirtyDaysAgo = subDays(now, 29)
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [recentOrders, statusCounts, topItemsRaw] = await Promise.all([
    db.order.findMany({
      where: {
        storeId: store.id,
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        deletedAt: null,
      },
      select: { createdAt: true, total: true },
    }),
    db.order.groupBy({
      by: ["status"],
      where: { storeId: store.id, deletedAt: null },
      _count: { _all: true },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          storeId: store.id,
          status: { notIn: ["CANCELLED", "REFUNDED"] },
          deletedAt: null,
        },
      },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
  ])

  // Build day-by-day series for last 30 days
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now })
  const dayMap = new Map<string, { revenue: number; orders: number }>()
  days.forEach((d) => {
    dayMap.set(format(d, "yyyy-MM-dd"), { revenue: 0, orders: 0 })
  })
  recentOrders.forEach((o) => {
    const key = format(new Date(o.createdAt), "yyyy-MM-dd")
    const existing = dayMap.get(key)
    if (existing) {
      existing.revenue += o.total
      existing.orders += 1
    }
  })
  const revenueByDay = Array.from(dayMap.entries()).map(([date, v]) => ({
    date: format(new Date(date), "d MMM", { locale: es }),
    revenue: Math.round(v.revenue * 100) / 100,
    orders: v.orders,
  }))

  // Status breakdown
  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    PAID: "Pagado",
    PROCESSING: "Procesando",
    SHIPPED: "Enviado",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
  }
  const ordersByStatus = statusCounts.map((s) => ({
    status: s.status,
    label: statusLabels[s.status] ?? s.status,
    count: s._count._all,
  }))

  // Top products — fetch names
  const productIds = topItemsRaw.map((r) => r.productId)
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p.name]))
  const topProducts = topItemsRaw.map((r) => ({
    name: productMap.get(r.productId) ?? r.productId.slice(-6),
    revenue: Math.round((r._sum.total ?? 0) * 100) / 100,
  }))

  // Summary stats
  const allOrders = await db.order.aggregate({
    where: {
      storeId: store.id,
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      deletedAt: null,
    },
    _sum: { total: true },
    _count: { _all: true },
    _avg: { total: true },
  })
  const thisMonthRevenue = await db.order.aggregate({
    where: {
      storeId: store.id,
      createdAt: { gte: startOfThisMonth },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      deletedAt: null,
    },
    _sum: { total: true },
  })

  const summary = {
    totalRevenue: allOrders._sum.total ?? 0,
    totalOrders: allOrders._count._all,
    avgTicket: allOrders._avg.total ?? 0,
    thisMonthRevenue: thisMonthRevenue._sum.total ?? 0,
  }

  return (
    <MetricsCharts
      revenueByDay={revenueByDay}
      ordersByStatus={ordersByStatus}
      topProducts={topProducts}
      summary={summary}
    />
  )
}
