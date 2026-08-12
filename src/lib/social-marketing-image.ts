import "server-only"
import sharp from "sharp"
import { buildSocialImageSvg, type SocialCampaign } from "@/lib/social-marketing"

export async function renderSocialImageBuffer(campaign: SocialCampaign) {
  const svg = buildSocialImageSvg(campaign)
  return sharp(Buffer.from(svg)).png().toBuffer()
}
