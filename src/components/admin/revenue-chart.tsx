"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatPrice } from "@/lib/utils"

type Props = {
  data: Array<{ createdAt: Date; _sum: { platformFee: number | null } }>
}

export function AdminRevenueChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: format(new Date(d.createdAt), "dd MMM", { locale: es }),
    commission: d._sum.platformFee ?? 0,
  }))

  if (chartData.length === 0) {
    return <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
        <Tooltip formatter={(v) => formatPrice(Number(v))} />
        <Bar dataKey="commission" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
