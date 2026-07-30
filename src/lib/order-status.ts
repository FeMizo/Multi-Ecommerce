export const ORDER_STATUSES = [
  "PENDING",
  "AWAITING_CONFIRMATION",
  "PENDING_PAYMENT",
  "CANCELLED",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "REFUNDED",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "No completado",
  AWAITING_CONFIRMATION: "Esperando confirmacion",
  PENDING_PAYMENT: "Pendiente de pago",
  CANCELLED: "Fallo de pago",
  PAID: "Pagado",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Completado",
  REFUNDED: "Reembolsado",
}
