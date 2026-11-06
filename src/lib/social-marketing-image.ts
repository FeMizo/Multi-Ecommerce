import "server-only"
import sharp from "sharp"
import { buildSocialImageSvg, type SocialCampaign } from "@/lib/social-marketing"

export async function renderSocialImageBuffer(campaign: SocialCampaign) {
  const svg = buildSocialImageSvg(campaign)
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer()
  const metadata = await sharp(buffer).metadata()

  if (metadata.format !== "png" || !metadata.width || !metadata.height) {
    throw new Error("La imagen generada no es un PNG valido")
  }

  return buffer
}
