import { Resend } from "resend"
import { formatPrice } from "@/lib/utils"
import { buildTransferReference, type TransferDetails } from "@/lib/transfer-details"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const emailFrom = process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? "AionSite <onboarding@resend.dev>"
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "https://shop.aionsite.com.mx"

type EmailStoreBranding = {
  name: string
  slug?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
}

type EmailOrderItem = {
  name: string
  quantity: number
  unitPrice: number
  total: number
  selectedOptions?: Array<{ name: string; value: string }>
}

type EmailCustomerInfo = {
  fullName?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  notes?: string | null
}

function emailClient() {
  if (!resend) throw new Error("RESEND_API_KEY no est? configurada")
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

function safeColor(value?: string | null) {
  const candidate = value?.trim()
  return candidate && /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate : "#2563eb"
}

function renderVariantText(selection?: Array<{ name: string; value: string }>) {
  if (!selection?.length) return ""
  return selection.map((entry) => `${entry.name}: ${entry.value}`).join(" - ")
}

function renderItemsTable(items: EmailOrderItem[]) {
  if (!items.length) return ""

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 20px;">
      <tr>
        <td style="padding: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #111827;">Productos</td>
      </tr>
      ${items
        .map(
          (item) => `
            <tr>
              <td style="padding: 14px 0; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 15px; font-weight: 600; color: #111827;">${escapeHtml(item.name)}</div>
                ${
                  item.selectedOptions?.length
                    ? `<div style="margin-top: 4px; font-size: 12px; color: #6b7280;">${escapeHtml(renderVariantText(item.selectedOptions))}</div>`
                    : ""
                }
                <div style="margin-top: 6px; font-size: 13px; color: #6b7280;">Cantidad: ${item.quantity}</div>
              </td>
              <td style="padding: 14px 0; border-top: 1px solid #e5e7eb; text-align: right; white-space: nowrap; font-size: 14px; color: #111827;">
                ${formatPrice(item.total)}
              </td>
            </tr>
          `
        )
        .join("")}
    </table>
  `
}

function renderInfoList(title: string, rows: Array<{ label: string; value?: string | null }>) {
  const visibleRows = rows.filter((row) => Boolean(row.value))
  if (!visibleRows.length) return ""

  return `
    <div style="margin-top: 20px;">
      <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px;">${escapeHtml(title)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${visibleRows
          .map(
            (row) => `
              <tr>
                <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">${escapeHtml(row.label)}</td>
                <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; color: #111827; font-size: 13px; text-align: right;">${escapeHtml(row.value ?? "")}</td>
              </tr>
            `
          )
          .join("")}
      </table>
    </div>
  `
}

function renderSummaryRows(rows: Array<{ label: string; value: string }>) {
  return `
    <div style="margin-top: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${rows
          .map(
            (row, index) => `
              <tr>
                <td style="padding: ${index === 0 ? "0 0 8px 0" : "8px 0"}; color: #6b7280; font-size: 13px;">${escapeHtml(row.label)}</td>
                <td style="padding: ${index === 0 ? "0 0 8px 0" : "8px 0"}; color: #111827; font-size: 13px; text-align: right; font-weight: ${index === rows.length - 1 ? 700 : 600};">${escapeHtml(row.value)}</td>
              </tr>
            `
          )
          .join("")}
      </table>
    </div>
  `
}

function renderEmailTemplate({
  store,
  title,
  subtitle,
  body,
  ctaLabel,
  ctaHref,
  items,
  summaryRows,
  infoBlocks,
  footerNote,
}: {
  store: EmailStoreBranding
  title: string
  subtitle?: string
  body?: string
  ctaLabel?: string
  ctaHref?: string
  items?: EmailOrderItem[]
  summaryRows?: Array<{ label: string; value: string }>
  infoBlocks?: Array<{ title: string; rows: Array<{ label: string; value?: string | null }> }>
  footerNote?: string
}) {
  const accent = safeColor(store.primaryColor)
  const logoMarkup = store.logoUrl
    ? `<div style="width: 56px; height: 56px; flex: 0 0 56px; border-radius: 16px; background: rgba(255,255,255,0.14); display: flex; align-items: center; justify-content: center; overflow: hidden; box-sizing: border-box;"><img src="${escapeHtml(store.logoUrl)}" alt="${escapeHtml(store.name)}" style="width: 100%; height: 100%; object-fit: contain; display: block;" /></div>`
    : `<div style="width: 56px; height: 56px; flex: 0 0 56px; border-radius: 16px; background: rgba(255,255,255,0.18); color: #fff; text-align: center; font-size: 20px; line-height: 56px; font-weight: 800; box-sizing: border-box;">${escapeHtml(store.name.slice(0, 1).toUpperCase())}</div>`

  return `
    <div style="margin: 0; padding: 0; background: #f3f4f6;">
      <div style="max-width: 680px; margin: 0 auto; padding: 24px 12px 36px;">
        <div style="border-radius: 24px; overflow: hidden; background: #ffffff; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, ${accent} 0%, #111827 100%); padding: 28px 28px 24px; color: #fff;">
            <div style="display: flex; align-items: center; gap: 16px; flex-wrap: nowrap;">
              ${logoMarkup}
              <div style="min-width: 0;">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em; opacity: 0.85;">${escapeHtml(store.name)}</div>
                <div style="font-size: 24px; font-weight: 800; margin-top: 6px;">${escapeHtml(title)}</div>
                ${subtitle ? `<div style="font-size: 14px; margin-top: 8px; opacity: 0.9;">${escapeHtml(subtitle)}</div>` : ""}
              </div>
            </div>
          </div>

          <div style="padding: 28px;">
            ${body ? `<div style="font-size: 15px; line-height: 1.7; color: #111827;">${body}</div>` : ""}
            ${items?.length ? renderItemsTable(items) : ""}
            ${summaryRows?.length ? renderSummaryRows(summaryRows) : ""}
            ${infoBlocks?.length
              ? infoBlocks.map((block) => renderInfoList(block.title, block.rows)).join("")
              : ""}
            ${
              ctaHref && ctaLabel
                ? `<div style="margin-top: 28px;"><a href="${escapeHtml(ctaHref)}" style="display: inline-block; background: ${accent}; color: #ffffff; text-decoration: none; font-weight: 700; padding: 13px 20px; border-radius: 12px;">${escapeHtml(ctaLabel)}</a></div>`
                : ""
            }
          </div>

          <div style="padding: 18px 28px 26px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; line-height: 1.6;">
            ${footerNote ? `<div>${escapeHtml(footerNote)}</div>` : ""}
            <div style="margin-top: 8px;">AionSite Shop - ${escapeHtml(appUrl)}</div>
          </div>
        </div>
      </div>
    </div>
  `
}

function buildPaymentDetails({
  paymentMethodLabel,
  transferCode,
  transferDetails,
  customerInfo,
}: {
  paymentMethodLabel: string
  transferCode?: string | null
  transferDetails?: TransferDetails
  customerInfo?: EmailCustomerInfo
}) {
  const transferReference = buildTransferReference(
    transferDetails?.transferReferencePrefix,
    transferDetails?.transferReferenceExtra
  )

  return [
    {
      title: "Pago",
      rows: [
        { label: "Método", value: paymentMethodLabel },
        { label: "Código", value: transferCode ?? null },
        { label: "Titular", value: transferDetails?.transferAccountName ?? null },
        { label: "Banco", value: transferDetails?.transferBank ?? null },
        { label: "Cuenta", value: transferDetails?.transferAccountNumber ?? null },
        { label: "Referencia", value: transferReference || null },
      ],
    },
    {
      title: "Cliente",
      rows: [
        { label: "Nombre", value: customerInfo?.fullName ?? null },
        { label: "Teléfono", value: customerInfo?.phone ?? null },
        { label: "Ciudad", value: customerInfo?.city ?? null },
        { label: "Notas", value: customerInfo?.notes ?? null },
      ],
    },
  ]
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${appUrl}/reset-password/${token}`
  const { data, error } = await emailClient().emails.send({
    from: emailFrom,
    to: [email],
    subject: "Restablece tu contraseña de AionSite",
    html: renderEmailTemplate({
      store: { name: "AionSite Shop", primaryColor: "#2563eb" },
      title: "Restablecer contraseña",
      subtitle: "Crea una nueva contraseña en minutos.",
      body: `
        <p>Haz clic en el botón para crear una nueva contraseña.</p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
      `,
      ctaLabel: "Restablecer contraseña",
      ctaHref: resetUrl,
      footerNote: "Este enlace expira en 30 minutos.",
    }),
  }, { idempotencyKey: `password-reset/${token}` })
  if (error) throw new Error(error.message)
  return { ok: true, id: data?.id }
}

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string
  name: string
}) {
  const { data, error } = await emailClient().emails.send({
    from: emailFrom,
    to: [email],
    subject: "Bienvenido a AionSite Shop",
    html: renderEmailTemplate({
      store: { name: "AionSite Shop", primaryColor: "#2563eb" },
      title: `Bienvenido, ${name}`,
      subtitle: "Tu cuenta ya está lista.",
      body: `
        <p>Tu cuenta en <strong>AionSite Shop</strong> ha sido creada.</p>
        <p>Desde aquí podrás administrar tu tienda, productos y pedidos.</p>
      `,
      ctaLabel: "Iniciar sesión",
      ctaHref: `${appUrl}/login`,
    }),
  }, { idempotencyKey: `welcome/${email}` })
  if (error) throw new Error(error.message)
  return { ok: true, id: data?.id }
}

export async function sendStoreVerificationEmail({
  email,
  name,
  storeName,
  verificationUrl,
}: {
  email: string
  name: string
  storeName: string
  verificationUrl: string
}) {
  const { data, error } = await emailClient().emails.send({
    from: emailFrom,
    to: [email],
    subject: `Verifica tu cuenta de ${escapeHtml(storeName)}`,
    html: renderEmailTemplate({
      store: { name: storeName, primaryColor: "#2563eb" },
      title: `Hola, ${name}`,
      subtitle: "Confirma la verificación de tu tienda.",
      body: `
        <p>Recibimos una solicitud para verificar la cuenta de <strong>${escapeHtml(storeName)}</strong>.</p>
        <p>Si todo está correcto, confírmala con el botón de abajo.</p>
      `,
      ctaLabel: "Verificar cuenta",
      ctaHref: verificationUrl,
      footerNote: `Si el botón no funciona, copia y pega esta URL: ${verificationUrl}`,
    }),
  }, { idempotencyKey: `store-verification/${email}/${verificationUrl}` })
  if (error) throw new Error(error.message)
  return { ok: true, id: data?.id }
}

export async function sendOrderConfirmationEmail({
  email,
  orderId,
  store,
  items,
  total,
  subtotal,
  discountAmount,
  paymentMethodLabel,
  customerInfo,
  transferCode,
  transferDetails,
}: {
  email: string
  orderId: string
  store: EmailStoreBranding
  items: EmailOrderItem[]
  total: number
  subtotal?: number
  discountAmount?: number
  paymentMethodLabel: string
  customerInfo?: EmailCustomerInfo
  transferCode?: string | null
  transferDetails?: TransferDetails
}) {
  const summaryRows = [
    { label: "Subtotal", value: formatPrice(subtotal ?? total) },
    ...(discountAmount ? [{ label: "Descuento", value: `- ${formatPrice(discountAmount)}` }] : []),
    { label: "Total", value: formatPrice(total) },
  ]

  const { data, error } = await emailClient().emails.send({
    from: emailFrom,
    to: [email],
    subject: `Confirmación de pedido #${orderId.slice(-8).toUpperCase()}`,
    html: renderEmailTemplate({
      store,
      title: "Pedido confirmado",
      subtitle: `Pedido #${orderId.slice(-8).toUpperCase()}`,
      body: `
        <p>Tu pedido en <strong>${escapeHtml(store.name)}</strong> fue recibido y ya está en proceso.</p>
        <p>Abajo encontrarás un resumen con productos, método de pago y datos de contacto.</p>
      `,
      items,
      summaryRows,
      infoBlocks: buildPaymentDetails({ paymentMethodLabel, transferCode, transferDetails, customerInfo }),
      ctaLabel: "Ver mis pedidos",
      ctaHref: `${appUrl}/orders?id=${orderId}`,
      footerNote: "Gracias por comprar con nosotros.",
    }),
  }, { idempotencyKey: `order-confirmation/${orderId}` })
  if (error) throw new Error(error.message)
  return { ok: true, id: data?.id }
}

export async function sendOrderReceivedEmail({
  email,
  orderId,
  store,
  items,
  total,
  subtotal,
  discountAmount,
  paymentMethodLabel,
  transferCode,
  transferDetails,
  customerInfo,
}: {
  email: string
  orderId: string
  store: EmailStoreBranding
  items: EmailOrderItem[]
  total: number
  subtotal?: number
  discountAmount?: number
  paymentMethodLabel: string
  transferCode?: string | null
  transferDetails?: TransferDetails
  customerInfo?: EmailCustomerInfo
}) {
  const summaryRows = [
    { label: "Subtotal", value: formatPrice(subtotal ?? total) },
    ...(discountAmount ? [{ label: "Descuento", value: `- ${formatPrice(discountAmount)}` }] : []),
    { label: "Total", value: formatPrice(total) },
  ]

  const { data, error } = await emailClient().emails.send({
    from: emailFrom,
    to: [email],
    subject: `Pedido recibido #${orderId.slice(-8).toUpperCase()}`,
    html: renderEmailTemplate({
      store,
      title: "Recibimos tu pedido",
      subtitle: `Pedido #${orderId.slice(-8).toUpperCase()}`,
      body: `
        <p>Tu pedido en <strong>${escapeHtml(store.name)}</strong> fue registrado.</p>
        <p>Revisa abajo los productos, totales y detalles de pago.</p>
      `,
      items,
      summaryRows,
      infoBlocks: buildPaymentDetails({ paymentMethodLabel, transferCode, transferDetails, customerInfo }),
      ctaLabel: "Ver mis pedidos",
      ctaHref: `${appUrl}/orders?id=${orderId}`,
      footerNote: "Si necesitas ayuda, responde este correo o contacta a la tienda.",
    }),
  }, { idempotencyKey: `order-received/${orderId}` })
  if (error) throw new Error(error.message)
  return { ok: true, id: data?.id }
}

export async function sendSellerNewOrderEmail({
  emails,
  orderId,
  store,
  items,
  total,
  subtotal,
  discountAmount,
  paymentMethodLabel,
  customerInfo,
  transferCode,
  transferDetails,
}: {
  emails: string[]
  orderId: string
  store: EmailStoreBranding
  items: EmailOrderItem[]
  total: number
  subtotal?: number
  discountAmount?: number
  paymentMethodLabel: string
  customerInfo?: EmailCustomerInfo
  transferCode?: string | null
  transferDetails?: TransferDetails
}) {
  const recipients = [...new Set(emails.filter(Boolean))]
  if (!recipients.length) return { ok: true, id: null }

  const summaryRows = [
    { label: "Subtotal", value: formatPrice(subtotal ?? total) },
    ...(discountAmount ? [{ label: "Descuento", value: `- ${formatPrice(discountAmount)}` }] : []),
    { label: "Total", value: formatPrice(total) },
  ]

  const { data, error } = await emailClient().emails.send({
    from: emailFrom,
    to: recipients,
    subject: `Nuevo pedido #${orderId.slice(-8).toUpperCase()}`,
    html: renderEmailTemplate({
      store,
      title: "Nuevo pedido recibido",
      subtitle: `Pedido #${orderId.slice(-8).toUpperCase()}`,
      body: `
        <p><strong>${escapeHtml(store.name)}</strong> tiene un nuevo pedido.</p>
        <p>Incluimos el detalle de productos, método de pago y datos del cliente.</p>
      `,
      items,
      summaryRows,
      infoBlocks: buildPaymentDetails({ paymentMethodLabel, transferCode, transferDetails, customerInfo }),
      ctaLabel: "Abrir panel",
      ctaHref: `${appUrl}/dashboard`,
      footerNote: "Revisa y confirma el pedido desde el panel.",
    }),
  }, { idempotencyKey: `seller-new-order/${orderId}` })
  if (error) throw new Error(error.message)
  return { ok: true, id: data?.id }
}

export async function sendOrderDeliveredEmail({
  email,
  orderId,
  store,
}: {
  email: string
  orderId: string
  store: EmailStoreBranding
}) {
  const { data, error } = await emailClient().emails.send({
    from: emailFrom,
    to: [email],
    subject: `Pedido entregado #${orderId.slice(-8).toUpperCase()}`,
    html: renderEmailTemplate({
      store,
      title: "Pedido entregado",
      subtitle: `Pedido #${orderId.slice(-8).toUpperCase()}`,
      body: `
        <p>Marcamos tu pedido en <strong>${escapeHtml(store.name)}</strong> como entregado.</p>
        <p>Gracias por comprar con nosotros.</p>
      `,
      ctaLabel: "Ver mis pedidos",
      ctaHref: `${appUrl}/orders?id=${orderId}`,
    }),
  }, { idempotencyKey: `order-delivered/${orderId}` })
  if (error) throw new Error(error.message)
  return { ok: true, id: data?.id }
}
