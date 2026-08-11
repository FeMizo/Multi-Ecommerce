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

export const DEFAULT_SOCIAL_DESTINATION = "https://shop.aionsite.com.mx"
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
    id: "featured",
    label: "Destacado",
    description: "Resalta una selección principal o tienda estrella.",
    copy: [
      "Hoy destaca una opción local en shop.aionsite.com.mx.",
      "Encuentra lo mejor de tu zona en shop.aionsite.com.mx.",
      "Una selección local para comprar mejor en shop.aionsite.com.mx.",
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
    id: "new",
    label: "Novedad",
    description: "Anuncia productos o tiendas recién agregadas.",
    copy: [
      "Nuevas opciones locales ya están en shop.aionsite.com.mx.",
      "Revisa lo nuevo de tu zona en shop.aionsite.com.mx.",
      "Llegaron más productos locales a shop.aionsite.com.mx.",
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
    id: "seasonal",
    label: "Temporada",
    description: "Contenido ligado a temporada o momento del mes.",
    copy: [
      "Aprovecha la temporada con shop.aionsite.com.mx.",
      "Ideas locales para esta semana en shop.aionsite.com.mx.",
      "Tu compra de temporada empieza en shop.aionsite.com.mx.",
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
    id: "top",
    label: "Top ventas",
    description: "Para lo más vendido o lo más buscado.",
    copy: [
      "Lo más buscado de tu zona está en shop.aionsite.com.mx.",
      "Los favoritos locales te esperan en shop.aionsite.com.mx.",
      "Descubre lo más vendido en shop.aionsite.com.mx.",
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
    id: "service",
    label: "Servicio",
    description: "Enfatiza atención, contacto y acompañamiento.",
    copy: [
      "Compra local con mejor atención en shop.aionsite.com.mx.",
      "Más confianza para comprar en shop.aionsite.com.mx.",
      "Encuentra opciones con apoyo local en shop.aionsite.com.mx.",
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

export const SOCIAL_THEME_ROTATION = [
  "launch",
  "featured",
  "store",
  "new",
  "offer",
  "seasonal",
  "product",
  "top",
  "trust",
  "service",
  "community",
] as const

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

  const scheduledIndex = ((date.getUTCDate() + weekParity) % SOCIAL_THEME_ROTATION.length + SOCIAL_THEME_ROTATION.length) % SOCIAL_THEME_ROTATION.length
  const tuesdayTopic = SOCIAL_THEME_ROTATION[scheduledIndex]
  const thursdayTopic = SOCIAL_THEME_ROTATION[(scheduledIndex + 3) % SOCIAL_THEME_ROTATION.length]
  const topicId = day === 2 ? tuesdayTopic : thursdayTopic
  const topic = getSocialTopic(topicId)

  const title = day === 2
    ? ({
        launch: "Compra local en un solo lugar",
        featured: "Descubre lo destacado de hoy",
        store: "Explora tiendas locales",
        new: "Novedades locales disponibles",
        offer: "Compra con ofertas locales",
        seasonal: "Aprovecha la temporada",
        product: "Compra productos locales",
        top: "Los favoritos de tu zona",
        trust: "Compra con más confianza",
        service: "Mejor atención local",
        community: "Apoya negocios cercanos",
      } as const)[topicId]
    : ({
        launch: "Descubre nuevas opciones locales",
        featured: "Una selección local destacada",
        store: "Tiendas cercanas para comparar",
        new: "Nuevos productos y tiendas",
        offer: "Hoy hay ofertas locales",
        seasonal: "Contenido local de temporada",
        product: "Tu siguiente compra local",
        top: "Lo más vendido de tu zona",
        trust: "Compra local con confianza",
        service: "Opciones con mejor atención",
        community: "Apoya negocios cercanos",
      } as const)[topicId]

  const imageHeadline = day === 2
    ? ({
        launch: "Compra local",
        featured: "Destacado local",
        store: "Tiendas cercanas",
        new: "Nuevas opciones",
        offer: "Ofertas locales",
        seasonal: "Temporada local",
        product: "Producto local",
        top: "Top ventas",
        trust: "Compra segura",
        service: "Mejor atención",
        community: "Apoya lo local",
      } as const)[topicId]
    : ({
        launch: "Compra local",
        featured: "Destacado local",
        store: "Tiendas cercanas",
        new: "Nuevas opciones",
        offer: "Ofertas locales",
        seasonal: "Temporada local",
        product: "Producto local",
        top: "Top ventas",
        trust: "Compra segura",
        service: "Mejor atención",
        community: "Apoya lo local",
      } as const)[topicId]

  const imageSubheadline = day === 2
    ? ({
        launch: "Tiendas, productos y ofertas en un solo sitio",
        featured: "Una selección lista para descubrir",
        store: "Comparar nunca fue tan fácil",
        new: "Lo nuevo de tu zona en un solo lugar",
        offer: "Promociones para comprar hoy",
        seasonal: "Compra pensando en la temporada",
        product: "Encuentra opciones útiles y cercanas",
        top: "Lo más buscado de tu zona",
        trust: "Más claridad para comprar local",
        service: "Compra con acompañamiento local",
        community: "Un solo sitio para apoyar lo local",
      } as const)[topicId]
    : ({
        launch: "Tiendas, productos y ofertas en un solo sitio",
        featured: "Una selección lista para descubrir",
        store: "Comparar nunca fue tan fácil",
        new: "Lo nuevo de tu zona en un solo lugar",
        offer: "Promociones para comprar hoy",
        seasonal: "Compra pensando en la temporada",
        product: "Encuentra opciones útiles y cercanas",
        top: "Lo más buscado de tu zona",
        trust: "Más claridad para comprar local",
        service: "Compra con acompañamiento local",
        community: "Un solo sitio para apoyar lo local",
      } as const)[topicId]

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
  const headlineLines = wrapLines(campaign.imageHeadline, 11)
  const subheadlineLines = wrapLines(campaign.imageSubheadline, 24)
  const footerLabel = campaign.topicId === "offer"
    ? "Promociones para comprar hoy"
    : campaign.topicId === "community"
      ? "Compra local desde tu zona"
      : "Tu multi site local"
  const shortDomain = campaign.destinationUrl.replace(/^https?:\/\//, "")

  return `
    <svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f26a21" />
          <stop offset="40%" stop-color="#c84a1c" />
          <stop offset="100%" stop-color="#20110c" />
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(590 380) rotate(90) scale(530 530)">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.20" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05" />
        </linearGradient>
        <linearGradient id="panelBorder" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffe7cf" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#f3b27a" stop-opacity="0.08" />
        </linearGradient>
        <linearGradient id="cta" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8ea86d" />
          <stop offset="100%" stop-color="#7a9257" />
        </linearGradient>
      </defs>
      <rect width="1080" height="1350" fill="url(#bg)" />
      <ellipse cx="540" cy="390" rx="420" ry="300" fill="url(#glow)" />
      <rect x="88" y="86" width="904" height="1176" rx="48" fill="url(#panel)" stroke="url(#panelBorder)" stroke-width="2" />
      <rect x="106" y="106" width="284" height="58" rx="29" fill="#ffffff" fill-opacity="0.12" />
      <rect x="116" y="116" width="38" height="38" rx="12" fill="#f26a21" />
      <path d="M125 129l10-10 10 10v10h-20z" fill="none" stroke="#FFF7EE" stroke-width="2.4" stroke-linejoin="round" />
      <path d="M130 129h10v10h-10z" fill="none" stroke="#FFF7EE" stroke-width="2.4" stroke-linejoin="round" />
      <circle cx="135" cy="124" r="4.5" fill="none" stroke="#FFF7EE" stroke-width="2.4" />
      <text x="168" y="142" fill="#FFF7EE" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">Multi Shop de AionSite</text>
      <rect x="744" y="110" width="144" height="42" rx="21" fill="#8ea86d" fill-opacity="0.22" stroke="#cfe0a2" stroke-width="1" />
      <text x="766" y="137" fill="#F7EFE5" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" letter-spacing="1.2">11:00 AM</text>
      <text x="106" y="276" fill="#FFF7EE" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" letter-spacing="2">MARTES Y JUEVES</text>
      ${buildSvgLines(headlineLines, 106, 430, 86, 92, "#FFF9F2", 900)}
      ${buildSvgLines(subheadlineLines, 106, 576, 50, 34, "#F8E8D8", 600)}
      <clipPath id="ctaClip">
        <rect x="106" y="650" width="484" height="76" rx="24" />
      </clipPath>
      <a href="${escapeXml(campaign.destinationUrl)}" target="_blank" rel="noopener noreferrer">
        <rect x="106" y="650" width="484" height="76" rx="24" fill="url(#cta)" stroke="#dbc96b" stroke-width="2" />
        <g clip-path="url(#ctaClip)">
          <circle cx="154" cy="688" r="18" fill="none" stroke="#FFF7EE" stroke-width="3" />
          <path d="M154 676v24M142 688h24M146 680h16M146 696h16" stroke="#FFF7EE" stroke-width="2.5" stroke-linecap="round" />
          <text x="192" y="698" fill="#FFF7EE" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">${escapeXml(shortDomain)}</text>
          <path d="M542 688l10-10" fill="none" stroke="#FFF7EE" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      </a>
      <rect x="106" y="764" width="790" height="2" fill="#ffffff" fill-opacity="0.16" />
      <text x="106" y="856" fill="#FFF7EE" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800">${escapeXml(footerLabel)}</text>
      <text x="106" y="910" fill="#F8E8D8" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="500">Compra local, descubre tiendas y ofrece identidad propia.</text>
      <a href="${escapeXml(campaign.destinationUrl)}" target="_blank" rel="noopener noreferrer">
        <text x="106" y="1110" fill="#FFE8D7" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(shortDomain)}</text>
      </a>
      <text x="106" y="1186" fill="#FFF7EE" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(campaign.imageFooter)}</text>
    </svg>
  `.trim()
}
