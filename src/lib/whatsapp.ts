const whatsappToken = process.env.WHATSAPP_CLOUD_API_TOKEN
const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

function normalizePhone(phone?: string | null) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  if (!digits) return null
  return digits.startsWith("52") ? digits : `52${digits}`
}

export async function sendWhatsAppText({
  phone,
  message,
}: {
  phone?: string | null
  message: string
}) {
  const to = normalizePhone(phone)
  if (!to || !whatsappToken || !whatsappPhoneNumberId) return { ok: false, skipped: true }

  const res = await fetch(`https://graph.facebook.com/v20.0/${whatsappPhoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  })

  if (!res.ok) throw new Error(await res.text())
  return { ok: true }
}
