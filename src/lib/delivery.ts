export const DELIVERY_METHODS = ["PICKUP", "LOCAL_DELIVERY"] as const

export type DeliveryMethodValue = (typeof DELIVERY_METHODS)[number]

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethodValue, string> = {
  PICKUP: "Recoger en tienda",
  LOCAL_DELIVERY: "Entrega local",
}

export function formatDeliveryMethodLabel(method: string) {
  return DELIVERY_METHOD_LABELS[method as DeliveryMethodValue] ?? method.replace(/_/g, " ")
}

export const DELIVERY_METHOD_DESCRIPTIONS: Record<DeliveryMethodValue, string> = {
  PICKUP: "El cliente recoge el pedido en la tienda.",
  LOCAL_DELIVERY: "El cliente recibe el pedido en una dirección local.",
}

export const DELIVERY_STATUSES = ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"] as const

export type DeliveryStatusValue = (typeof DELIVERY_STATUSES)[number]

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatusValue, string> = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignado",
  IN_TRANSIT: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

export const ACTIVE_DELIVERY_STATUSES: DeliveryStatusValue[] = ["PENDING", "ASSIGNED", "IN_TRANSIT"]

export type DeliveryAddress = {
  formattedAddress: string
  lat: number
  lng: number
  notes?: string | null
}

export type DeliveryLocationDraft = {
  formattedAddress: string
  lat: number | null
  lng: number | null
  notes: string
}

export type DeliveryFormState = {
  deliveryMethod: DeliveryMethodValue
  formattedAddress: string
  lat: number | null
  lng: number | null
  notes: string
}

export const DRIVER_STATUSES = ["AVAILABLE", "OFFLINE"] as const

export type DriverStatusValue = (typeof DRIVER_STATUSES)[number]

export const DRIVER_STATUS_LABELS: Record<DriverStatusValue, string> = {
  AVAILABLE: "Disponible",
  OFFLINE: "Desconectado",
}

export const DRIVER_STATUS_DESCRIPTIONS: Record<DriverStatusValue, string> = {
  AVAILABLE: "Puede recibir asignaciones.",
  OFFLINE: "No recibe pedidos nuevos.",
}

export function isDriverAvailable(status: DriverStatusValue) {
  return status === "AVAILABLE"
}

export function normalizeDriverPhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim()
}

export function buildDriverEmail(phone: string) {
  const digits = normalizeDriverPhone(phone).replace(/[^\d]/g, "")
  return `rider-${digits || phone.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "driver"}@rider.local`
}

export function normalizeWhatsAppPhone(phone: string) {
  return normalizeDriverPhone(phone).replace(/[^\d]/g, "")
}

export function buildDeliveryAssignmentMessage(input: {
  orderId: string
  customerName: string
  customerPhone: string | null
  address: string | null
  notes: string | null
  totalLabel: string
  riderUrl: string
  mapUrl?: string | null
}) {
  const lines = [
    "Nuevo pedido asignado",
    `Pedido: ${input.orderId}`,
    `Cliente: ${input.customerName}`,
    input.customerPhone ? `Telefono: ${input.customerPhone}` : null,
    input.address ? `Direccion: ${input.address}` : null,
    input.notes ? `Notas: ${input.notes}` : null,
    input.mapUrl ? `Mapa: ${input.mapUrl}` : null,
    `Total: ${input.totalLabel}`,
    `Panel: ${input.riderUrl}`,
  ].filter(Boolean)

  return lines.join("\n")
}

export function buildWhatsAppLink(phone: string, message: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone)
  const text = encodeURIComponent(message)
  return `https://wa.me/${normalizedPhone}?text=${text}`
}

export function buildGoogleMapsSearchUrl(input: {
  formattedAddress?: string | null
  lat?: number | null
  lng?: number | null
}) {
  if (typeof input.lat === "number" && typeof input.lng === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${input.lat},${input.lng}`
  }

  const address = input.formattedAddress?.trim()
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  }

  return null
}

export function deliveryStatusToOrderStatus(status: DeliveryStatusValue) {
  switch (status) {
    case "ASSIGNED":
      return "PROCESSING" as const
    case "IN_TRANSIT":
      return "SHIPPED" as const
    case "DELIVERED":
      return "DELIVERED" as const
    case "CANCELLED":
      return "CANCELLED" as const
    case "PENDING":
    default:
      return "PENDING" as const
  }
}

export function orderStatusToDeliveryStatus(status: string): DeliveryStatusValue {
  switch (status) {
    case "PROCESSING":
      return "ASSIGNED"
    case "SHIPPED":
      return "IN_TRANSIT"
    case "DELIVERED":
      return "DELIVERED"
    case "CANCELLED":
      return "CANCELLED"
    default:
      return "PENDING"
  }
}
