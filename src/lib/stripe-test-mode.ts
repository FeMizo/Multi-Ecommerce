// Explicit opt-in, separate sandbox credentials. Never fall back to live keys.
export function isStripeTestMode(env: Record<string, string | undefined> = process.env) {
  return env.STRIPE_MODE === "test" && /^sk_test_.+/.test(env.STRIPE_TEST_SECRET_KEY ?? "")
}

export function requireStripeTestMode() {
  if (!isStripeTestMode()) throw new Error("Tarjeta TEST requiere STRIPE_MODE=test y STRIPE_TEST_SECRET_KEY de prueba")
}

export function getStripeTestDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  const value = env.STRIPE_TEST_DATABASE_URL
  if (!value) throw new Error("Configura una base aislada en STRIPE_TEST_DATABASE_URL")
  const target = (value: string) => {
    const url = new URL(value)
    return `${url.hostname}:${url.port || "5432"}${url.pathname}`
  }
  if ([env.MULTI_POSTGRES_PRISMA_URL, env.MULTI_POSTGRES_URL_NON_POOLING, env.DATABASE_URL].some(original => original && target(original) === target(value))) {
    throw new Error("La base TEST debe ser distinta de la base existente")
  }
  return value
}
