import socialMarketingConfig from "@/config/social-marketing.json"

export type MarketingSnippet = {
  label: string
  text: string
}

export const marketingKit = {
  brandName: socialMarketingConfig.brand.name,
  canonicalUrl: socialMarketingConfig.brand.canonicalUrl,
  positioning: socialMarketingConfig.brand.positioning,
  ...socialMarketingConfig.marketingKit,
} as const
