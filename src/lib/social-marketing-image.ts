import "server-only"
import { buildSocialImageSvg, type SocialCampaign } from "@/lib/social-marketing"

export async function renderSocialImageBuffer(campaign: SocialCampaign) {
  const svg = buildSocialImageSvg(campaign)
  return Buffer.from(svg)
}
