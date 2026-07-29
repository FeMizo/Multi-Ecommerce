export type MarketingSnippet = {
  label: string
  text: string
}

export const marketingKit = {
  brandName: "AionSite Shop",
  canonicalUrl: "https://shop.aionsite.com.mx",
  positioning: "Marketplace local para descubrir tiendas, productos y ofertas en un solo lugar.",
  linkTargets: [
    { label: "Inicio", href: "https://shop.aionsite.com.mx/" },
    { label: "Tiendas", href: "https://shop.aionsite.com.mx/stores" },
    { label: "Productos", href: "https://shop.aionsite.com.mx/search" },
    { label: "Ofertas", href: "https://shop.aionsite.com.mx/offers" },
    { label: "Categorías", href: "https://shop.aionsite.com.mx/categories" },
  ],
  bios: [
    {
      platform: "Facebook Page",
      text: "Marketplace local de AionSite Shop. Tiendas, productos y ofertas en shop.aionsite.com.mx.",
    },
    {
      platform: "Instagram",
      text: "Compra local en un solo lugar. Descubre tiendas y ofertas en shop.aionsite.com.mx.",
    },
  ],
  snippets: {
    groups: [
      {
        label: "Grupo corto",
        text: "Compra local desde un solo lugar. Entra a shop.aionsite.com.mx y descubre tiendas, productos y ofertas cerca de ti.",
      },
      {
        label: "Grupo con CTA",
        text: "Ya puedes explorar tiendas y productos en shop.aionsite.com.mx. Entra, compara y compra local desde un solo lugar.",
      },
      {
        label: "Grupo de lanzamiento",
        text: "Lanzamos shop.aionsite.com.mx para reunir tiendas, productos y ofertas locales en un solo sitio. Entra y revisa lo que hay cerca de ti.",
      },
    ] as MarketingSnippet[],
    facebook: [
      {
        label: "Post principal",
        text: "AionSite Shop ya está listo para ayudarte a comprar local en un solo lugar. Descubre tiendas, productos y ofertas en shop.aionsite.com.mx.",
      },
      {
        label: "Post con beneficio",
        text: "Menos vueltas, más opciones locales. Entra a shop.aionsite.com.mx y encuentra tiendas, productos y ofertas cerca de ti.",
      },
    ] as MarketingSnippet[],
    instagram: [
      {
        label: "Caption breve",
        text: "Compra local en un solo lugar. Descubre tiendas, productos y ofertas en shop.aionsite.com.mx. #AionSiteShop #CompraLocal #Mexico",
      },
      {
        label: "Caption lanzamiento",
        text: "Hoy lanzamos una forma más simple de descubrir opciones locales. Entra a shop.aionsite.com.mx y revisa tiendas, productos y ofertas cerca de ti. #AionSiteShop #ShopLocal #CompraLocal",
      },
    ] as MarketingSnippet[],
  },
  creativeIdeas: [
    "Portada con logo, dominio y una frase de compra local.",
    "Historia con producto destacado y enlace directo a shop.aionsite.com.mx.",
    "Carrusel con tiendas, categorías y ofertas del sitio.",
  ],
  checklist: [
    "Crear la Facebook Page con el nombre AionSite Shop.",
    "Crear el Instagram profesional con el mismo nombre o uno muy cercano.",
    "Poner shop.aionsite.com.mx como sitio web principal en ambos perfiles.",
    "Usar el mismo logo, colores y tono en portada, bio y destacados.",
    "Publicar primero un post fijado con enlace al sitio.",
    "Probar el enlace desde móvil antes de compartir en grupos.",
    "Revisar reglas de cada grupo local antes de publicar.",
    "Guardar cada copy usado para reutilizar versiones futuras.",
  ],
} as const
