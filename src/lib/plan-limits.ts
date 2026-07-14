import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { hasPlanEntitlements } from "@/lib/billing-rules"

type DbClient = Prisma.TransactionClient | typeof db
const PLAN_TIME_ZONE = "America/Mexico_City"

function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value
  const match = offset?.match(/^GMT([+-])(\d{2}):(\d{2})$/)
  if (!match) throw new Error(`No se pudo calcular la zona horaria ${timeZone}`)

  const minutes = Number(match[2]) * 60 + Number(match[3])
  return match[1] === "+" ? minutes : -minutes
}

export function getMexicoCityMonthStart(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PLAN_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now)
  const year = Number(parts.find((part) => part.type === "year")?.value)
  const month = Number(parts.find((part) => part.type === "month")?.value)
  const utcMidnight = Date.UTC(year, month - 1, 1)
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcMidnight + 12 * 60 * 60 * 1000), PLAN_TIME_ZONE)

  return new Date(utcMidnight - offsetMinutes * 60 * 1000)
}

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

export async function checkOrderLimit(storeId: string, client: DbClient = db, now = new Date()) {
  const plan = await getEffectivePlan(storeId, client)
  const maxOrdersMonth = plan ? plan.maxOrdersMonth : 0

  if (maxOrdersMonth === null) {
    return { ok: true as const, count: 0, max: null as number | null }
  }

  const startOfMonth = getMexicoCityMonthStart(now)

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
