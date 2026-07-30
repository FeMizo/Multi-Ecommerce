export const SOCIAL_CHANNELS = ["FACEBOOK", "INSTAGRAM"] as const

export type SocialChannel = (typeof SOCIAL_CHANNELS)[number]

export type SocialTopic = {
  id: string
  label: string
  description: string
  copy: string[]
}

export const DEFAULT_SOCIAL_DESTINATION = "https://shop.aionsite.com.mx"

export const SOCIAL_TOPICS: SocialTopic[] = [
  {
    id: "launch",
    label: "Lanzamiento",
    description: "Para anunciar que la marca ya esta activa.",
    copy: [
      "Compra local en un solo lugar. Entra a shop.aionsite.com.mx.",
      "Ya esta listo tu mercado local: shop.aionsite.com.mx.",
      "Descubre tiendas y ofertas cercanas en shop.aionsite.com.mx.",
    ],
  },
  {
    id: "store",
    label: "Tienda destacada",
    description: "Para mostrar una tienda o una seleccion de productos.",
    copy: [
      "Apoya tiendas locales y compara opciones en shop.aionsite.com.mx.",
      "Tu proxima compra local puede estar en shop.aionsite.com.mx.",
      "Explora marcas cercanas en un solo sitio: shop.aionsite.com.mx.",
    ],
  },
  {
    id: "offer",
    label: "Oferta",
    description: "Para impulsar promociones y descuentos.",
    copy: [
      "Encuentra ofertas locales y compra con confianza en shop.aionsite.com.mx.",
      "Mas opciones, menos vueltas: shop.aionsite.com.mx.",
      "Las mejores ofertas locales te esperan en shop.aionsite.com.mx.",
    ],
  },
  {
    id: "product",
    label: "Producto",
    description: "Para mostrar un producto puntual.",
    copy: [
      "Descubre productos utiles y cercanos en shop.aionsite.com.mx.",
      "Un solo sitio para comparar productos locales: shop.aionsite.com.mx.",
      "Compra mejor con opciones locales en shop.aionsite.com.mx.",
    ],
  },
  {
    id: "trust",
    label: "Confianza",
    description: "Para reforzar seguridad, orden y cercania.",
    copy: [
      "Compra con calma: tiendas, productos y ofertas en shop.aionsite.com.mx.",
      "Mas claridad para comprar local: shop.aionsite.com.mx.",
      "Tu comunidad compra mejor en shop.aionsite.com.mx.",
    ],
  },
  {
    id: "community",
    label: "Comunidad",
    description: "Para hablar de apoyo a lo local y cercania.",
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
