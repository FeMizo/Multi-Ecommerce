import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createLogger, serializeError } from "@/lib/observability"

const logger = createLogger("health")

export async function GET() {
  const checks = {
    database: { ok: false },
    runtime: {
      postgresConfigured: Boolean(
        process.env.MULTI_POSTGRES_PRISMA_URL ?? process.env.MULTI_POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL
      ),
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      authConfigured: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    },
  }

  try {
    await db.$queryRaw`SELECT 1`
    checks.database.ok = true
  } catch (error) {
    logger.error("database-check-failed", {
      error: serializeError(error),
    })
  }

  return NextResponse.json(
    {
      status: checks.database.ok ? "healthy" : "degraded",
      ts: new Date().toISOString(),
      checks,
    },
    { status: checks.database.ok ? 200 : 503 }
  )
}
