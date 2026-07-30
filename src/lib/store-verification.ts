import crypto from "crypto"

export function buildStoreVerificationUrl(origin: string, storeId: string, token: string) {
  return `${origin}/api/verification/store?storeId=${encodeURIComponent(storeId)}&token=${encodeURIComponent(token)}`
}

export function createStoreVerificationToken(storeId: string) {
  const identifier = `store-verification:${storeId}`
  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)

  return { identifier, token, tokenHash, expiresAt }
}
