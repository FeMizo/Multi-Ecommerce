export const ORDER_STATUSES = [
  "PENDING",
  "AWAITING_CONFIRMATION",
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "No completado",
  AWAITING_CONFIRMATION: "Esperando confirmación",
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Aceptado",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Completado",
  CANCELLED: "Fallo de pago",
  REFUNDED: "Reembolsado",
}
