import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createPgPool } from "@/lib/pg-pool"

function createPrismaClient() {
  const rawUrl = new URL(process.env.MULTI_POSTGRES_PRISMA_URL!)
  rawUrl.searchParams.delete("sslmode")
  const pool = createPgPool(rawUrl.toString(), 1)
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

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
