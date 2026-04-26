"use client"

import {
  AreaChart,
  Area,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#94a3b8",
  PAID: "#22c55e",
  PROCESSING: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  REFUNDED: "#f59e0b",
}

type Props = {
  dailyData: Array<{ date: string; gmv: number; fee: number }>
  statusData: Array<{ status: string; count: number }>
}

export function AdminMetricsCharts({ dailyData, statusData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>GMV y comisiones · Últimos 30 días</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `S/${v}`} />
              <Tooltip
                formatter={(value, name) => [
                  formatPrice(Number(value ?? 0)),
                  String(name ?? ""),
                ]}
              />
              <Area
                type="monotone"
                dataKey="gmv"
                name="GMV"
                stroke="hsl(var(--primary))"
                fill="url(#gmvGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="fee"
                name="Comisión"
                stroke="#10b981"
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pedidos por estado</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  Number(value ?? 0),
                  String(name ?? ""),
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
