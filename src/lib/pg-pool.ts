import { Pool, type PoolConfig } from "pg"

export function getPgSslConfig(
  allowSelfSigned = process.env.MULTI_POSTGRES_ALLOW_SELF_SIGNED === "true",
  certificateAuthority = process.env.MULTI_POSTGRES_SSL_CA,
): PoolConfig["ssl"] {
  if (allowSelfSigned) {
    return { rejectUnauthorized: false }
  }

  return {
    rejectUnauthorized: true,
    ...(certificateAuthority
      ? { ca: certificateAuthority.replace(/\\n/g, "\n") }
      : {}),
  }
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
