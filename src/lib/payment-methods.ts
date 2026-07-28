export const PAYMENT_METHODS = ["STRIPE", "CASH_ON_DELIVERY", "TRANSFER"] as const

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  STRIPE: "Pago Stripe",
  CASH_ON_DELIVERY: "Pago contra entrega",
  TRANSFER: "Pago transferencia",
}

export const PAYMENT_METHOD_DESCRIPTIONS: Record<PaymentMethodValue, string> = {
  STRIPE: "Pago en línea con tarjeta.",
  CASH_ON_DELIVERY: "La tienda asume el riesgo y cobrará al recibir el pedido.",
  TRANSFER: "Te mostraremos el código y las instrucciones para transferir.",
}

export function generateTransferCode() {
  return `TRF-${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`
}
