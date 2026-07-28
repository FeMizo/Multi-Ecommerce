export function buildWhatsAppShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function buildWhatsAppChatUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "")
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

type CartShareItem = {
  storeId: string
  storeName: string
  name: string
  quantity: number
  price: number
}

export function buildCartWhatsAppMessage(items: CartShareItem[], total: number, formatPrice: (value: number) => string) {
  const grouped = items.reduce<Record<string, { storeName: string; lines: string[] }>>((acc, item) => {
    if (!acc[item.storeId]) {
      acc[item.storeId] = { storeName: item.storeName, lines: [] }
    }
    acc[item.storeId].lines.push(`- ${item.name} x${item.quantity} (${formatPrice(item.price * item.quantity)})`)
    return acc
  }, {})

  return [
    "Hola, quiero hacer este pedido:",
    ...Object.values(grouped).flatMap((group) => [group.storeName, ...group.lines]),
    `Total: ${formatPrice(total)}`,
  ].join("\n")
}

export async function resolveCartWhatsAppRecipient(storeIds: string[]) {
  const uniqueStoreIds = [...new Set(storeIds)].filter(Boolean)
  if (uniqueStoreIds.length !== 1) return null

  const res = await fetch("/api/whatsapp/cart-target", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeId: uniqueStoreIds[0] }),
  })

  if (!res.ok) return null
  const data = await res.json() as { phone?: string | null; storeName?: string | null }
  return data.phone ? data : null
}
