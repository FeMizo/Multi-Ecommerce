import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createPgPool } from "@/lib/pg-pool"

function createPrismaClient() {
  const rawValue = process.env.MULTI_POSTGRES_PRISMA_URL ?? process.env.MULTI_POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL
  if (!rawValue) {
    throw new Error("Set MULTI_POSTGRES_PRISMA_URL, MULTI_POSTGRES_URL_NON_POOLING, or DATABASE_URL")
  }

  const rawUrl = new URL(rawValue)
  rawUrl.searchParams.delete("sslmode")
  const pool = createPgPool(rawUrl.toString(), 1)
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getDb() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getDb()
    const value = Reflect.get(client, property, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
}) as PrismaClient

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
