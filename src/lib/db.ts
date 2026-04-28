import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

function createPrismaClient() {
  // pg v8 treats sslmode=require as verify-full, overriding Pool ssl options.
  // Remove sslmode from URL so Pool's ssl config (rejectUnauthorized: false) takes effect.
  const rawUrl = new URL(process.env.MULTI_POSTGRES_PRISMA_URL!)
  rawUrl.searchParams.delete("sslmode")
  const pool = new Pool({
    connectionString: rawUrl.toString(),
    ssl: { rejectUnauthorized: false },
    max: 1,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

// Tenant-scoped client — todas las queries a modelos con storeId
// quedan automáticamente filtradas. Usar en lugar de `db` dentro de
// server actions y route handlers que operen en contexto de una tienda.
const TENANT_MODELS = ["Product", "Order", "OrderItem", "Payment", "CartItem", "StoreMember"]

export function dbForStore(storeId: string) {
  return db.$extends({
    query: {
      $allModels: {
        async $allOperations({
          args,
          query,
          model,
        }: {
          args: Record<string, unknown>
          query: (args: Record<string, unknown>) => Promise<unknown>
          model: string
        }) {
          if (TENANT_MODELS.includes(model)) {
            args.where = { ...(args.where as Record<string, unknown>), storeId }
          }
          return query(args)
        },
      },
    },
  })
}
