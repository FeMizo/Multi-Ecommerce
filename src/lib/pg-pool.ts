import { Pool, type PoolConfig } from "pg"

export function getPgSslConfig(): PoolConfig["ssl"] {
  if (process.env.NODE_ENV !== "production") {
    return { rejectUnauthorized: false }
  }
  return { rejectUnauthorized: true }
}

export function sanitizePgUrl(url: string): string {
  return url
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/[?&]pgbouncer=[^&]*/g, "")
}

export function createPgPool(connectionString: string, max = 1): Pool {
  const sanitized = sanitizePgUrl(connectionString)
  return new Pool({
    connectionString: sanitized,
    ssl: getPgSslConfig(),
    max,
  })
}
