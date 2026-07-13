import { Resend } from "resend"
import { formatPrice } from "@/lib/utils"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const emailFrom = process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? "AionSite <onboarding@resend.dev>"
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:1500"

function emailClient() {
  if (!resend) throw new Error("RESEND_API_KEY no está configurada")
  return resend
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]!)
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${appUrl}/reset-password/${token}`
  const { data, error } = await emailClient().emails.send({
    from: emailFrom,
    to: [email],
    subject: "Recupera tu contraseña de AionSite",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 12px;">Recupera tu contraseña</h2>
        <p>Haz clic en el botón de abajo para crear una nueva contraseña.</p>
        <p style="margin: 24px 0;"><a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 16px; border-radius: 8px; text-decoration: none;">Restablecer contraseña</a></p>
        <p style="font-size: 12px; color: #6b7280;">El enlace vence en 30 minutos. Si no solicitaste este cambio, ignora este correo.</p>
      </div>
    `,
  }, { idempotencyKey: `password-reset/${token}` })
  if (error) throw new Error(error.message)
  return { ok: true, id: data?.id }
}

export async function sendOrderConfirmationEmail({
  email,
  orderId,
  storeName,
  total,
}: {
  email: string
  orderId: string
  storeName: string
  total: number
}) {
  const { data, error } = await emailClient().emails.send({
    from: emailFrom,
    to: [email],
    subject: `Confirmación de pedido #${orderId.slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2>¡Pago confirmado!</h2>
        <p>Tu pedido en <strong>${escapeHtml(storeName)}</strong> fue recibido.</p>
        <p><strong>Total:</strong> ${formatPrice(total)}</p>
        <p><a href="${appUrl}/account/orders">Consulta el estado de tu pedido</a></p>
      </div>
    `,
  }, { idempotencyKey: `order-confirmation/${orderId}` })
  if (error) throw new Error(error.message)
  return { ok: true, id: data?.id }
}
