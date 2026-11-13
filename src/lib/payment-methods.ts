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
  TRANSFER: "Te mostraremos los datos bancarios y la referencia para transferir.",
}

export function generateTransferCode() {
  return `TRF-${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`
}

export function stripePaymentPresentation(testMode: boolean) {
  return testMode ? { label: "Tarjeta (TEST)", description: "Pago de prueba con Stripe. Sin cargos reales." } : { label: PAYMENT_METHOD_LABELS.STRIPE, description: PAYMENT_METHOD_DESCRIPTIONS.STRIPE }
}
