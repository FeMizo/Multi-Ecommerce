import { Badge } from "@/components/ui/badge"

type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "outline" }> = {
  PENDING:    { label: "Pendiente",    variant: "secondary" },
  PAID:       { label: "Pagado",       variant: "success" },
  PROCESSING: { label: "Procesando",  variant: "default" },
  SHIPPED:    { label: "Enviado",      variant: "outline" },
  DELIVERED:  { label: "Entregado",   variant: "success" },
  CANCELLED:  { label: "Cancelado",   variant: "destructive" },
  REFUNDED:   { label: "Reembolsado", variant: "secondary" },
}

export const ORDER_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])
)

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as OrderStatus] ?? { label: status, variant: "outline" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
