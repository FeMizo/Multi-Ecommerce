"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatPrice } from "@/lib/utils"

type Props = {
  data: Array<{ createdAt: Date; _sum: { subtotal: number | null } }>
}

export function SellerMetricsChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: format(new Date(d.createdAt), "dd MMM", { locale: es }),
    total: d._sum.subtotal ?? 0,
  }))

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Sin datos suficientes
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `S/${v}`} />
        <Tooltip formatter={(v) => formatPrice(Number(v))} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#colorTotal)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
