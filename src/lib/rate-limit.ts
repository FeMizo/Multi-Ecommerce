type RateLimitEntry = { count: number; resetAt: number }

const entries = new Map<string, RateLimitEntry>()

export function getClientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown"
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = entries.get(key)
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: Math.ceil(windowMs / 1000) }
  }

  current.count += 1
  if (current.count > limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
  }

  return { allowed: true, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
}

