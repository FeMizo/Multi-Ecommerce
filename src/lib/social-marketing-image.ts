import "server-only"
import { readFileSync } from "node:fs"
import path from "node:path"
import sharp from "sharp"
import { buildSocialImageSvg, type SocialCampaign } from "@/lib/social-marketing"

const FONT_DIR = path.join(process.cwd(), "node_modules", "@fontsource", "roboto", "files")

function getFontData(fileName: string) {
  return readFileSync(path.join(FONT_DIR, fileName)).toString("base64")
}

function injectEmbeddedFont(svg: string) {
  const regular = getFontData("roboto-latin-400-normal.woff")
  const bold = getFontData("roboto-latin-700-normal.woff")
  const style = `<style>@font-face{font-family:EmbeddedRoboto;src:url(data:font/woff;base64,${regular}) format('woff');font-weight:400;}@font-face{font-family:EmbeddedRoboto;src:url(data:font/woff;base64,${bold}) format('woff');font-weight:700 900;}text{font-family:EmbeddedRoboto,Arial,sans-serif !important;}</style>`

  return svg.includes("</defs>") ? svg.replace("</defs>", `</defs>${style}`) : svg.replace(">", `>${style}`)
}

export async function renderSocialImageBuffer(campaign: SocialCampaign) {
  const svg = injectEmbeddedFont(buildSocialImageSvg(campaign))
  return sharp(Buffer.from(svg)).png().toBuffer()
}
