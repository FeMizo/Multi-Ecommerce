export const DEFAULT_SHOP_BANNER = "/placeholders/shop-banner.webp"
export const DEFAULT_SHOP_ICON = "/placeholders/shop-icon.webp"
export const DEFAULT_PRODUCT_IMAGE = "/placeholders/product.webp"

export function withProductPlaceholder(images: string[]) {
  return images[0] || DEFAULT_PRODUCT_IMAGE
}
