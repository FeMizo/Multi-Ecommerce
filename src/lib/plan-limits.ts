import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { hasPlanEntitlements } from "@/lib/billing-rules"

type DbClient = Prisma.TransactionClient | typeof db

export async function getStorePlan(storeId: string) {
  return db.storeSubscription.findUnique({
    where: { storeId },
    include: { plan: true },
  })
}

export async function getEffectivePlan(storeId: string, client: DbClient = db) {
  const subscription = await client.storeSubscription.findUnique({
    where: { storeId },
    include: { plan: true },
  })

  if (subscription && hasPlanEntitlements(subscription.status)) {
    return subscription.plan
  }

  return client.plan.findFirst({ where: { slug: "free", isActive: true } })
}

export async function checkProductLimit(storeId: string, client: DbClient = db) {
  const plan = await getEffectivePlan(storeId, client)
  const maxProducts = plan ? plan.maxProducts : 0

  if (maxProducts === null) {
    return { ok: true as const, count: 0, max: null as number | null }
  }

  const count = await client.product.count({
    where: {
      storeId,
      deletedAt: null,
      status: { in: ["ACTIVE", "DRAFT", "PAUSED"] },
    },
  })

  return { ok: count < maxProducts, count, max: maxProducts }
}

export async function checkOrderLimit(storeId: string, client: DbClient = db) {
  const plan = await getEffectivePlan(storeId, client)
  const maxOrdersMonth = plan ? plan.maxOrdersMonth : 0

  if (maxOrdersMonth === null) {
    return { ok: true as const, count: 0, max: null as number | null }
  }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const count = await client.order.count({
    where: {
      storeId,
      createdAt: { gte: startOfMonth },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      deletedAt: null,
    },
  })

  return { ok: count < maxOrdersMonth, count, max: maxOrdersMonth }
}

export async function getPlanUsage(storeId: string) {
  const [products, orders, plan] = await Promise.all([
    checkProductLimit(storeId),
    checkOrderLimit(storeId),
    getEffectivePlan(storeId),
  ])

  return {
    planName: plan?.name ?? "Free",
    products,
    orders,
    commissionRate: plan?.commissionRate ?? 0.05,
  }
}
