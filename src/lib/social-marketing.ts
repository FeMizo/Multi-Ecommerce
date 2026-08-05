import sharp from "sharp"
import { siteUrl } from "@/lib/site-url"

export const SOCIAL_CHANNELS = ["FACEBOOK", "INSTAGRAM"] as const

export type SocialChannel = (typeof SOCIAL_CHANNELS)[number]

export type SocialTopic = {
  id: string
  label: string
  description: string
  copy: string[]
}

export type SocialCampaign = {
  title: string
  topicId: string
  channels: SocialChannel[]
  caption: string
  imageHeadline: string
  imageSubheadline: string
  imageFooter: string
  imageFileName: string
  destinationUrl: string
}

export const DEFAULT_SOCIAL_DESTINATION = siteUrl
export const DEFAULT_SOCIAL_ASSET_BASE_URL = (
  process.env.APP_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "https://aionsite.com.mx"
).replace(/\/$/, "")

export const SOCIAL_TOPICS: SocialTopic[] = [
  {
    id: "launch",
    label: "Lanzamiento",
    description: "Anuncio de presencia y descubrimiento local.",
    copy: [
      "Compra local en un solo lugar. Entra a shop.aionsite.com.mx.",
      "Ya esta listo tu mercado local: shop.aionsite.com.mx.",
      "Descubre tiendas y ofertas cercanas en shop.aionsite.com.mx.",
    ],
  },
  {
    id: "store",
    label: "Tienda destacada",
    description: "Para mostrar tiendas y opciones cercanas.",
    copy: [
      "Apoya tiendas locales y compara opciones en shop.aionsite.com.mx.",
      "Tu proxima compra local puede estar en shop.aionsite.com.mx.",
      "Explora marcas cercanas en un solo sitio: shop.aionsite.com.mx.",
    ],
  },
  {
    id: "offer",
    label: "Oferta",
    description: "Promociones y descuentos con enfoque local.",
    copy: [
      "Encuentra ofertas locales y compra con confianza en shop.aionsite.com.mx.",
      "Mas opciones, menos vueltas: shop.aionsite.com.mx.",
      "Las mejores ofertas locales te esperan en shop.aionsite.com.mx.",
    ],
  },
  {
    id: "product",
    label: "Producto",
    description: "Para destacar un producto puntual.",
    copy: [
      "Descubre productos utiles y cercanos en shop.aionsite.com.mx.",
      "Un solo sitio para comparar productos locales: shop.aionsite.com.mx.",
      "Compra mejor con opciones locales en shop.aionsite.com.mx.",
    ],
  },
  {
    id: "trust",
    label: "Confianza",
    description: "Enfatiza seguridad y cercania.",
    copy: [
      "Compra con calma: tiendas, productos y ofertas en shop.aionsite.com.mx.",
      "Mas claridad para comprar local: shop.aionsite.com.mx.",
      "Tu comunidad compra mejor en shop.aionsite.com.mx.",
    ],
  },
  {
    id: "community",
    label: "Comunidad",
    description: "Apoyo a negocios locales.",
    copy: [
      "Apoya lo local y descubre opciones cercanas en shop.aionsite.com.mx.",
      "La comunidad local compra mejor en shop.aionsite.com.mx.",
      "Todo tu mercado local reunido en shop.aionsite.com.mx.",
    ],
  },
]

export function getSocialTopic(topicId: string) {
  return SOCIAL_TOPICS.find((topic) => topic.id === topicId) ?? SOCIAL_TOPICS[0]
}

export function buildSocialCopy(topicId: string, variant = 0, destinationUrl = DEFAULT_SOCIAL_DESTINATION) {
  const topic = getSocialTopic(topicId)
  const copy = topic.copy[variant % topic.copy.length] ?? topic.copy[0]
  return copy.includes("shop.aionsite.com.mx") ? copy : `${copy} ${destinationUrl}`
}

export function normalizeChannels(value: unknown): SocialChannel[] {
  if (!Array.isArray(value)) return ["FACEBOOK"]
  const channels = value.filter((channel): channel is SocialChannel => SOCIAL_CHANNELS.includes(channel as SocialChannel))
  return channels.length > 0 ? channels : ["FACEBOOK"]
}

export function requiresImage(channels: SocialChannel[]) {
  return channels.includes("INSTAGRAM")
}

function getIsoWeek(date: Date) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function escapeXml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&apos;",
    '"': "&quot;",
  })[character]!)
}

function wrapLines(text: string, maxChars = 28) {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.length > 0 ? lines : [text]
}

function buildSvgLines(lines: string[], x: number, y: number, lineHeight: number, fontSize: number, fill: string, fontWeight = 700) {
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}">${escapeXml(line)}</text>`)
    .join("")
}

export function buildScheduledSocialCampaign(date = new Date()): SocialCampaign {
  const day = date.getUTCDay()
  const weekParity = getIsoWeek(date) % 2

  const tuesdayTopic = weekParity === 0 ? "launch" : "store"
  const thursdayTopic = weekParity === 0 ? "offer" : "community"
  const topicId = day === 2 ? tuesdayTopic : thursdayTopic
  const topic = getSocialTopic(topicId)

  const title = day === 2
    ? (weekParity === 0 ? "Compra local en un solo lugar" : "Explora tiendas locales")
    : (weekParity === 0 ? "Hoy hay ofertas locales" : "Apoya negocios cercanos")

  const imageHeadline = day === 2
    ? (weekParity === 0 ? "Compra local" : "Tiendas cercanas")
    : (weekParity === 0 ? "Ofertas locales" : "Apoya lo local")

  const imageSubheadline = day === 2
    ? "Tiendas, productos y ofertas en un solo sitio"
    : "Promociones para comprar hoy desde tu zona"

  const imageFooter = "Multi Shop by AionSite"
  const destinationUrl = DEFAULT_SOCIAL_DESTINATION
  const caption = `${buildSocialCopy(topicId, weekParity, destinationUrl)}\n\nMulti Shop by AionSite\n${destinationUrl}`

  const stamp = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`

  return {
    title,
    topicId: topic.id,
    channels: ["FACEBOOK", "INSTAGRAM"],
    caption,
    imageHeadline,
    imageSubheadline,
    imageFooter,
    imageFileName: `promo-${topic.id}-${stamp}.png`,
    destinationUrl,
  }
}

export function buildSocialImageSvg(campaign: SocialCampaign) {
  const headlineLines = wrapLines(campaign.imageHeadline, 24)
  const subheadlineLines = wrapLines(campaign.imageSubheadline, 36)
  const urlLines = wrapLines(campaign.destinationUrl.replace(/^https?:\/\//, ""), 28)

  return `
    <svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f26a21" />
          <stop offset="48%" stop-color="#c94d1d" />
          <stop offset="100%" stop-color="#2c160f" />
        </linearGradient>
        <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.16)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0.06)" />
        </linearGradient>
      </defs>
      <rect width="1080" height="1350" fill="url(#bg)" />
      <circle cx="920" cy="180" r="220" fill="#8ea86d" fill-opacity="0.18" />
      <circle cx="180" cy="1180" r="240" fill="#f7efe5" fill-opacity="0.10" />
      <rect x="72" y="76" width="936" height="1198" rx="42" fill="url(#panel)" stroke="rgba(255,255,255,0.18)" />
      <rect x="104" y="108" width="244" height="64" rx="32" fill="rgba(255,255,255,0.16)" />
      <text x="128" y="148" fill="#FFF7EE" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800">Multi Shop by AionSite</text>
      <text x="104" y="272" fill="#FFF7EE" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" letter-spacing="2">MARTES Y JUEVES 11:00 AM</text>
      ${buildSvgLines(headlineLines, 104, 382, 74, 78, "#FFF9F2", 800)}
      ${buildSvgLines(subheadlineLines, 104, 558, 52, 36, "#F8E8D8", 600)}
      <rect x="104" y="640" width="336" height="76" rx="22" fill="#8ea86d" />
      <text x="144" y="689" fill="#142013" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800">shop.aionsite.com.mx</text>
      <rect x="104" y="760" width="872" height="2" fill="rgba(255,255,255,0.18)" />
      <text x="104" y="848" fill="#FFF7EE" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Ventas locales para el multi site</text>
      <text x="104" y="904" fill="#F8E8D8" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="500">Compra local, descubre tiendas y publica con identidad propia.</text>
      ${buildSvgLines(urlLines, 104, 1090, 32, 24, "#FFE8D7", 600)}
      <text x="104" y="1184" fill="#FFF7EE" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(campaign.imageFooter)}</text>
    </svg>
  `.trim()
}

export async function renderSocialImageBuffer(campaign: SocialCampaign) {
  const svg = buildSocialImageSvg(campaign)
  return sharp(Buffer.from(svg)).png().toBuffer()
}
