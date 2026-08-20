import "server-only"
import { readFileSync } from "node:fs"
import path from "node:path"
import sharp from "sharp"
import { buildSocialImageSvg, type SocialCampaign } from "@/lib/social-marketing"

const FONT_DIR = path.join(process.cwd(), "node_modules", "@fontsource", "roboto", "files")
const REGULAR_FONT_FILE = path.join(FONT_DIR, "roboto-latin-400-normal.woff")
const BOLD_FONT_FILE = path.join(FONT_DIR, "roboto-latin-700-normal.woff")

type TextLayer = {
  text: string
  left: number
  top: number
  width: number
  fontSize: number
  color: string
  weight?: "400" | "700" | "900"
  align?: "left" | "center"
}

function escapePango(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]!)
}

function wrapText(text: string, maxChars: number) {
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

function stripSvgText(svg: string) {
  return svg.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, "")
}

function textInput(layer: TextLayer) {
  const fontFile = layer.weight === "400" ? REGULAR_FONT_FILE : BOLD_FONT_FILE
  const align = layer.align ?? "left"
  return {
    input: {
      text: {
        text: `<span foreground="${layer.color}" size="${Math.round(layer.fontSize * 1024)}" font_weight="${layer.weight ?? "700"}">${escapePango(layer.text)}</span>`,
        font: "Roboto",
        fontfile: fontFile,
        width: layer.width,
        align,
        rgba: true,
      },
    },
    left: layer.left,
    top: layer.top,
  }
}

function buildTextLayers(campaign: SocialCampaign): TextLayer[] {
  if (campaign.layout === "style") {
    const isMonday = campaign.styleVariant === "monday"
    return isMonday
      ? [
          { text: "Multi Shop", left: 412, top: 106, width: 360, fontSize: 56, color: "#5a2a13", weight: "900" },
          { text: "de AionSite", left: 412, top: 165, width: 330, fontSize: 34, color: "#f05f1d", weight: "900" },
          { text: "Compra local", left: 190, top: 356, width: 700, fontSize: 94, color: "#5a2a13", weight: "900", align: "center" },
          { text: "en un solo lugar", left: 140, top: 486, width: 800, fontSize: 92, color: "#f05f1d", weight: "900", align: "center" },
          { text: "shop.aionsite.com.mx", left: 226, top: 674, width: 628, fontSize: 28, color: "#fffdf8", weight: "900", align: "center" },
        ]
      : [
          { text: "Multi Shop", left: 642, top: 142, width: 390, fontSize: 108, color: "#5a2a13", weight: "900" },
          { text: "de AionSite", left: 642, top: 286, width: 390, fontSize: 92, color: "#f05f1d", weight: "900" },
          { text: "shop.aionsite.com.mx", left: 642, top: 767, width: 322, fontSize: 26, color: "#fffdf8", weight: "900", align: "center" },
        ]
  }

  const headline = wrapText(campaign.imageHeadline, 17)
  const subheadline = wrapText(campaign.imageSubheadline, 30)
  const shortDomain = campaign.destinationUrl.replace(/^https?:\/\//, "")
  const layers: TextLayer[] = [
    { text: "Multi Shop", left: 198, top: 90, width: 340, fontSize: 30, color: "#542613", weight: "900" },
    { text: "de AionSite", left: 198, top: 126, width: 260, fontSize: 22, color: "#d94f17", weight: "700" },
    { text: "COMPRA LOCAL", left: 820, top: 99, width: 180, fontSize: 17, color: "#6a3017", weight: "900" },
    { text: "Descubre cerca de ti", left: 199, top: 555, width: 230, fontSize: 17, color: "#6a3017", weight: "900" },
    { text: "Tiendas · productos · ofertas", left: 150, top: 886, width: 270, fontSize: 16, color: "#8b5a3c", weight: "700" },
    { text: "Entra y descubre opciones locales", left: 198, top: 1022, width: 640, fontSize: 31, color: "#fffdf8", weight: "900" },
    { text: shortDomain, left: 198, top: 1062, width: 340, fontSize: 20, color: "#fff2e4", weight: "700" },
    { text: "Compra local en un solo lugar", left: 92, top: 1137, width: 430, fontSize: 22, color: "#542613", weight: "900" },
    { text: "Más variedad para tu zona. Más visibilidad para cada negocio.", left: 92, top: 1183, width: 740, fontSize: 19, color: "#6a3017", weight: "400" },
    { text: campaign.imageFooter, left: 92, top: 1237, width: 360, fontSize: 20, color: "#d95117", weight: "900" },
  ]

  headline.forEach((line, index) => {
    layers.push({ text: line, left: 92, top: 198 + index * 78, width: 820, fontSize: 68, color: "#542613", weight: "900" })
  })
  subheadline.forEach((line, index) => {
    layers.push({ text: line, left: 92, top: 362 + index * 42, width: 540, fontSize: 28, color: "#df5017", weight: "700" })
  })

  return layers
}

export async function renderSocialImageBuffer(campaign: SocialCampaign) {
  readFileSync(REGULAR_FONT_FILE)
  readFileSync(BOLD_FONT_FILE)

  const svg = stripSvgText(buildSocialImageSvg(campaign))
  return sharp(Buffer.from(svg))
    .png()
    .composite(buildTextLayers(campaign).map(textInput))
    .png()
    .toBuffer()
}
