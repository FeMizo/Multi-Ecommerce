export const LAUNCH_CODE = "LANZAMIENTO20"
export const LAUNCH_START = new Date("2026-11-13T00:00:00-06:00")
export const LAUNCH_END = new Date("2026-12-01T00:00:00-06:00")
export const LAUNCH_LABEL = "-20% Lanzamiento"

export function isLaunchOpen(now = new Date()) {
  return now >= LAUNCH_START && now < LAUNCH_END
}

export function launchBaseSlug(slug: string) {
  const match = /^(starter|pro|business|agency)-promo$/.exec(slug)
  return match?.[1] ?? null
}

export function launchPrice(normal: number) {
  return Math.round(normal * 80) / 100
}
