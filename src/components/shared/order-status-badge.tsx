import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from "@/lib/order-status"

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "success" | "outline" }
> = {
  PENDING_PAYMENT: { label: ORDER_STATUS_LABELS.PENDING_PAYMENT, variant: "secondary" },
  AWAITING_CONFIRMATION: { label: ORDER_STATUS_LABELS.AWAITING_CONFIRMATION, variant: "outline" },
  PENDING: { label: ORDER_STATUS_LABELS.PENDING, variant: "secondary" },
  PAID: { label: ORDER_STATUS_LABELS.PAID, variant: "success" },
  PROCESSING: { label: ORDER_STATUS_LABELS.PROCESSING, variant: "default" },
  SHIPPED: { label: ORDER_STATUS_LABELS.SHIPPED, variant: "outline" },
  DELIVERED: { label: ORDER_STATUS_LABELS.DELIVERED, variant: "success" },
  CANCELLED: { label: ORDER_STATUS_LABELS.CANCELLED, variant: "destructive" },
  REFUNDED: { label: ORDER_STATUS_LABELS.REFUNDED, variant: "secondary" },
}

export { ORDER_STATUS_LABELS, ORDER_STATUSES }

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as OrderStatus] ?? { label: status, variant: "outline" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
