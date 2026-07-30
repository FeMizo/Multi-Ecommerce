export const ORDER_STATUSES = [
  "PENDING",
  "PENDING_PAYMENT",
  "CANCELLED",
  "PAID",
  "DELIVERED",
  "AWAITING_CONFIRMATION",
  "PROCESSING",
  "SHIPPED",
  "REFUNDED",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  AWAITING_CONFIRMATION: "Esperando confirmacion",
  PENDING: "Sin pagar",
  PAID: "Aceptado",
  PROCESSING: "Procesando",
  SHIPPED: "Enviado",
  DELIVERED: "Completado",
  CANCELLED: "Fallo de pago",
  REFUNDED: "Reembolsado",
}
