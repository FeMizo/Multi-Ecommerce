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
  layout?: "sales" | "style"
  styleVariant?: "monday" | "friday"
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
    id: "brand",
    label: "Marca",
    description: "Posts de estilo y presencia visual.",
    copy: [
      "Multi Shop de AionSite: compra local en un solo lugar.",
      "Una marca para descubrir lo local en shop.aionsite.com.mx.",
      "Tu escaparate local con identidad propia en shop.aionsite.com.mx.",
    ],
  },
  {
    id: "showcase",
    label: "Escaparate",
    description: "Presentación visual de la propuesta.",
    copy: [
      "Tu escaparate local, más claro y más visual.",
      "Una forma simple de ver lo local en shop.aionsite.com.mx.",
      "Productos, tiendas y comunidad reunidos en un solo estilo.",
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

export const SOCIAL_STYLE_ROTATION = [
  "brand",
  "showcase",
  "featured",
  "trust",
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

function buildBrandIconGroup(x: number, y: number, size: number, accent = "#f05f1d", foreground = "#fffdf8") {
  const scale = size / 132
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <circle cx="66" cy="18" r="8" fill="none" stroke="${foreground}" stroke-width="4" />
      <circle cx="18" cy="48" r="8" fill="none" stroke="${foreground}" stroke-width="4" />
      <circle cx="114" cy="48" r="8" fill="none" stroke="${foreground}" stroke-width="4" />
      <circle cx="18" cy="104" r="8" fill="none" stroke="${foreground}" stroke-width="4" />
      <circle cx="114" cy="104" r="8" fill="none" stroke="${foreground}" stroke-width="4" />
      <circle cx="66" cy="128" r="8" fill="none" stroke="${foreground}" stroke-width="4" />
      <path d="M26 48L66 20L106 48M26 48L26 104M106 48L106 104M26 104L66 128L106 104" fill="none" stroke="${foreground}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M42 62L66 36L90 62V104H42Z" fill="none" stroke="${foreground}" stroke-width="6" stroke-linejoin="round" />
      <path d="M52 66H80V82H52Z" fill="${foreground}" />
      <path d="M56 82H76V104H56Z" fill="${foreground}" />
      <path d="M18 42C28 30 30 22 22 12C10 16 8 28 18 42Z" fill="#a5ba76" />
      <path d="M114 74C122 86 124 98 112 110C100 106 98 88 114 74Z" fill="#a5ba76" />
      <path d="M106 58h12v20h-12z" fill="${accent}" opacity="0.95" />
    </g>
  `
}

export function buildScheduledSocialCampaign(date = new Date()): SocialCampaign {
  const topicId = SOCIAL_THEME_ROTATION[Math.floor(Math.random() * SOCIAL_THEME_ROTATION.length)]
  const topic = getSocialTopic(topicId)

  const titleByTopic: Record<string, string> = {
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
  }

  const headlineByTopic: Record<string, string> = {
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
  }

  const subheadlineByTopic: Record<string, string> = {
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
  }

  const title = titleByTopic[topicId] ?? titleByTopic.launch
  const imageHeadline = headlineByTopic[topicId] ?? headlineByTopic.launch
  const imageSubheadline = subheadlineByTopic[topicId] ?? subheadlineByTopic.launch

  const imageFooter = "Multi Shop by AionSite"
  const destinationUrl = DEFAULT_SOCIAL_DESTINATION
  const caption = `${buildSocialCopy(topicId, Math.floor(Math.random() * topic.copy.length), destinationUrl)}\n\nMulti Shop by AionSite\n${destinationUrl}`

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
    layout: "sales",
  }
}

export function buildScheduledStyleCampaign(date = new Date()): SocialCampaign {
  const day = date.getUTCDay()
  const styleVariant = day === 1 ? "monday" : "friday"
  const topicId = SOCIAL_STYLE_ROTATION[Math.floor(Math.random() * SOCIAL_STYLE_ROTATION.length)]
  const topic = getSocialTopic(topicId)

  const title = styleVariant === "monday"
    ? "Lunes de marca local"
    : "Viernes de escaparate local"

  const imageHeadline = styleVariant === "monday"
    ? "Compra local"
    : "Multi Shop"

  const imageSubheadline = styleVariant === "monday"
    ? "en un solo lugar"
    : "de AionSite"

  const imageFooter = "Multi Shop by AionSite"
  const destinationUrl = DEFAULT_SOCIAL_DESTINATION
  const caption = `${buildSocialCopy(topicId, Math.floor(Math.random() * topic.copy.length), destinationUrl)}\n\nMulti Shop by AionSite\n${destinationUrl}`
  const stamp = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}`

  return {
    title,
    topicId: topic.id,
    channels: ["FACEBOOK", "INSTAGRAM"],
    caption,
    imageHeadline,
    imageSubheadline,
    imageFooter,
    imageFileName: `style-${styleVariant}-${topic.id}-${stamp}.png`,
    destinationUrl,
    layout: "style",
    styleVariant,
  }
}

export function buildSocialImageSvg(campaign: SocialCampaign) {
  if (campaign.layout === "style") {
    return buildStyleSocialImageSvg(campaign)
  }

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

function buildStyleSocialImageSvg(campaign: SocialCampaign) {
  const isMonday = campaign.styleVariant === "monday"
  const titleLines = isMonday ? ["Compra local", "en un solo lugar"] : ["Multi Shop", "de AionSite"]
  const subtitle = isMonday
    ? "Tiendas, productos y ofertas en un solo sitio"
    : "Tu escaparate local con identidad propia"
  const chips = isMonday
    ? [
        ["Productos", "de calidad"],
        ["Tiendas", "locales"],
        ["Apoya tu", "comunidad"],
        ["Compra", "con confianza"],
      ]
    : [
        ["Locales", "cercanos"],
        ["Selección", "visual"],
        ["Comunidad", "local"],
        ["Compra", "con estilo"],
      ]

  return `
    <svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">
      <defs>
        <linearGradient id="bgStyle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fff8ef" />
          <stop offset="100%" stop-color="#f8eddc" />
        </linearGradient>
        <linearGradient id="orangeBand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff8a2b" />
          <stop offset="100%" stop-color="#d14c13" />
        </linearGradient>
        <linearGradient id="brownText" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#5a2a13" />
          <stop offset="100%" stop-color="#3f190f" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#b85a1f" flood-opacity="0.22" />
        </filter>
      </defs>
      <rect width="1080" height="1350" fill="url(#bgStyle)" />
      <circle cx="60" cy="120" r="180" fill="#f27a17" fill-opacity="0.86" />
      <circle cx="1050" cy="118" r="180" fill="#f27a17" fill-opacity="0.82" />
      <circle cx="84" cy="1240" r="170" fill="#f27a17" fill-opacity="0.80" />
      <circle cx="1012" cy="1242" r="170" fill="#f27a17" fill-opacity="0.80" />
      <path d="M0 1120C140 1080 180 1150 320 1118C440 1090 500 1030 620 1060C760 1098 804 1180 940 1162C1000 1154 1046 1120 1080 1108V1350H0Z" fill="url(#orangeBand)" fill-opacity="0.98" />
      <path d="M0 1280C150 1245 250 1310 386 1290C520 1270 574 1218 696 1236C826 1258 922 1320 1080 1288V1350H0Z" fill="#c94112" fill-opacity="0.88" />
      <rect x="112" y="74" width="856" height="1198" rx="56" fill="#fff7ef" filter="url(#softShadow)" />
      ${isMonday ? `
        <rect x="214" y="92" width="652" height="132" rx="36" fill="#ffffff" fill-opacity="0.35" />
        ${buildBrandIconGroup(274, 120, 84)}
        <text x="412" y="155" fill="url(#brownText)" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="800">Multi Shop</text>
        <text x="412" y="196" fill="url(#orangeBand)" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800">de AionSite</text>
        <text x="540" y="455" text-anchor="middle" fill="url(#brownText)" font-family="Georgia, 'Times New Roman', serif" font-size="94" font-weight="700">Compra local</text>
        <text x="540" y="582" text-anchor="middle" fill="url(#orangeBand)" font-family="Georgia, 'Times New Roman', serif" font-size="92" font-weight="700">en un solo lugar</text>
        <a href="${escapeXml(DEFAULT_SOCIAL_DESTINATION)}" target="_blank" rel="noopener noreferrer">
          <rect x="226" y="650" width="628" height="78" rx="26" fill="url(#orangeBand)" filter="url(#softShadow)" />
          <text x="540" y="702" text-anchor="middle" fill="#fffdf8" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800">shop.aionsite.com.mx</text>
        </a>
        <g>
          ${chips.map((chip, index) => `
            <g transform="translate(${166 + (index % 2) * 372}, ${796 + Math.floor(index / 2) * 138})">
              <circle cx="0" cy="0" r="68" fill="#fff9f2" stroke="#f2dec5" stroke-width="6" />
              <rect x="-18" y="-6" width="36" height="28" rx="6" fill="none" stroke="#db6a24" stroke-width="4" />
              <path d="M-18 -6h36M-12 -6v-14a12 12 0 0124 0v14" fill="none" stroke="#db6a24" stroke-width="4" stroke-linecap="round" />
              <text x="0" y="92" text-anchor="middle" fill="#6b2f13" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${chip[0]}</text>
              <text x="0" y="120" text-anchor="middle" fill="#f27a17" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${chip[1]}</text>
            </g>
          `).join("")}
        </g>
        <g transform="translate(428 1120)">
          <rect x="0" y="0" width="224" height="224" rx="34" fill="#f06a1c" filter="url(#softShadow)" />
          ${buildBrandIconGroup(48, 48, 128, "#fffdf8", "#fffdf8")}
        </g>
        <text x="540" y="1062" text-anchor="middle" fill="#6a2e13" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">${escapeXml(subtitle)}</text>
      ` : `
        <g transform="translate(116 84)">
          <rect x="0" y="0" width="360" height="360" rx="54" fill="url(#orangeBand)" filter="url(#softShadow)" />
          ${buildBrandIconGroup(62, 62, 236, "#fffdf8", "#fffdf8")}
        </g>
        <text x="642" y="256" fill="url(#brownText)" font-family="Arial, Helvetica, sans-serif" font-size="108" font-weight="800">Multi Shop</text>
        <text x="642" y="388" fill="url(#orangeBand)" font-family="Arial, Helvetica, sans-serif" font-size="102" font-weight="800">de AionSite</text>
        <line x1="644" y1="482" x2="916" y2="482" stroke="#de6f24" stroke-width="3" />
        <line x1="644" y1="482" x2="740" y2="482" stroke="#de6f24" stroke-width="8" />
        <text x="642" y="580" fill="#5a2a13" font-family="Georgia, 'Times New Roman', serif" font-size="58" font-weight="700">${escapeXml(titleLines[0])}</text>
        <text x="642" y="676" fill="#f05f1d" font-family="Georgia, 'Times New Roman', serif" font-size="64" font-weight="700">${escapeXml(titleLines[1])}</text>
        <a href="${escapeXml(DEFAULT_SOCIAL_DESTINATION)}" target="_blank" rel="noopener noreferrer">
          <rect x="642" y="742" width="322" height="82" rx="28" fill="url(#orangeBand)" filter="url(#softShadow)" />
          <text x="803" y="796" text-anchor="middle" fill="#fffdf8" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="800">shop.aionsite.com.mx</text>
        </a>
        <text x="642" y="892" fill="#6a2e13" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600">${escapeXml(subtitle)}</text>
        <g opacity="0.22">
          ${Array.from({ length: 5 }, (_, row) =>
            Array.from({ length: 5 }, (_, col) =>
              `<circle cx="${660 + col * 82}" cy="${84 + row * 42}" r="7" fill="#f2b26a" />`
            ).join("")
          ).join("")}
        </g>
        <g transform="translate(402 1088)">
          <rect x="0" y="0" width="244" height="180" rx="38" fill="#f06a1c" filter="url(#softShadow)" />
          ${buildBrandIconGroup(52, 26, 140, "#fffdf8", "#fffdf8")}
        </g>
      `}
    </svg>
  `.trim()
}
