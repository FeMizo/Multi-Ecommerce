"use client"

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { TrendingUp, ShoppingBag, Banknote, Receipt } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DayData = { date: string; revenue: number; orders: number }
type StatusData = { status: string; label: string; count: number }
type ProductData = { name: string; revenue: number }
type Summary = { totalRevenue: number; totalOrders: number; avgTicket: number; thisMonthRevenue: number }

type Props = {
  revenueByDay: DayData[]
  ordersByStatus: StatusData[]
  topProducts: ProductData[]
  summary: Summary
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PAID: "#10b981",
  PROCESSING: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#059669",
  CANCELLED: "#ef4444",
  REFUNDED: "#6b7280",
}

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]

function fmt(n: number) {
  return `S/ ${n.toFixed(2)}`
}

export function MetricsCharts({ revenueByDay, ordersByStatus, topProducts, summary }: Props) {
  const summaryCards = [
    {
      label: "Ingresos totales",
      value: fmt(summary.totalRevenue),
      icon: Banknote,
      sub: `${fmt(summary.thisMonthRevenue)} este mes`,
    },
    {
      label: "Pedidos totales",
      value: summary.totalOrders.toString(),
      icon: ShoppingBag,
      sub: "sin cancelados ni reembolsos",
    },
    {
      label: "Ticket promedio",
      value: fmt(summary.avgTicket),
      icon: Receipt,
      sub: "por pedido completado",
    },
    {
      label: "Últimos 30 días",
      value: fmt(revenueByDay.reduce((acc, d) => acc + d.revenue, 0)),
      icon: TrendingUp,
      sub: `${revenueByDay.reduce((acc, d) => acc + d.orders, 0)} pedidos`,
    },
  ]

  // Only show days with label every ~5 days to avoid crowding
  const tickInterval = Math.max(1, Math.floor(revenueByDay.length / 6))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Métricas</h1>
        <p className="text-sm text-muted-foreground">Resumen de los últimos 30 días</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-xl font-bold mt-1 tabular-nums">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Revenue area chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingresos diarios</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                interval={tickInterval}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `S/${v}`}
                width={56}
              />
              <Tooltip
                formatter={(value) => [fmt(Number(value ?? 0)), "Ingresos"]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos por día</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByDay} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  interval={tickInterval}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  formatter={(value) => [Number(value ?? 0), "Pedidos"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by status pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos por estado</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {ordersByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {ordersByStatus.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? "#6b7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [Number(value ?? 0), String(name ?? "")]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 productos por ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `S/${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 16) + "…" : v)}
                />
                <Tooltip
                  formatter={(value) => [fmt(Number(value ?? 0)), "Ingresos"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="revenue" radius={[0, 3, 3, 0]} maxBarSize={20}>
                  {topProducts.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
