export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://shop.aionsite.com.mx")
  .replace(/\/$/, "")

export function absoluteUrl(path = "/") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`
}
