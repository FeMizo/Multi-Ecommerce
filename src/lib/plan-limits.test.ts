import assert from "node:assert/strict"
import test from "node:test"
import { config } from "dotenv"

config({ path: ".env.local", quiet: true })

type PlanLimitsModule = typeof import("./plan-limits")
type PlanLimitClient = NonNullable<Parameters<PlanLimitsModule["checkProductLimit"]>[1]>
type OrderLimitClient = NonNullable<Parameters<PlanLimitsModule["checkOrderLimit"]>[1]>

async function checkProductLimit(storeId: string, client: PlanLimitClient) {
  const planLimits = await import("./plan-limits")
  return planLimits.checkProductLimit(storeId, client)
}

async function planLimits() {
  return import("./plan-limits")
}

function productLimitClient({
  subscriptionStatus = "ACTIVE",
  subscribedMax = 2,
  freeMax = 10,
  productCount = 0,
}: {
  subscriptionStatus?: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED"
  subscribedMax?: number | null
  freeMax?: number | null
  productCount?: number
}) {
  let countQueries = 0
  const client = {
    storeSubscription: {
      findUnique: async () => ({
        status: subscriptionStatus,
        plan: { maxProducts: subscribedMax },
      }),
    },
    plan: {
      findFirst: async () => ({ maxProducts: freeMax }),
    },
    product: {
      count: async () => {
        countQueries += 1
        return productCount
      },
    },
  } as unknown as PlanLimitClient

  return { client, getCountQueries: () => countQueries }
}

test("permite crear mientras queden espacios en el plan activo", async () => {
  const { client } = productLimitClient({ subscribedMax: 2, productCount: 1 })

  assert.deepEqual(await checkProductLimit("store_1", client), {
    ok: true,
    count: 1,
    max: 2,
  })
})

test("bloquea la creación al alcanzar el máximo de productos", async () => {
  const { client } = productLimitClient({ subscribedMax: 2, productCount: 2 })

  assert.deepEqual(await checkProductLimit("store_1", client), {
    ok: false,
    count: 2,
    max: 2,
  })
})

test("una suscripción sin beneficios usa los límites del plan Free", async () => {
  const { client } = productLimitClient({
    subscriptionStatus: "CANCELLED",
    subscribedMax: 200,
    freeMax: 10,
    productCount: 10,
  })

  assert.deepEqual(await checkProductLimit("store_1", client), {
    ok: false,
    count: 10,
    max: 10,
  })
})

test("un máximo nulo es ilimitado y evita contar productos", async () => {
  const { client, getCountQueries } = productLimitClient({ subscribedMax: null, productCount: 999 })

  assert.deepEqual(await checkProductLimit("store_1", client), {
    ok: true,
    count: 0,
    max: null,
  })
  assert.equal(getCountQueries(), 0)
})

test("el mes de órdenes inicia a medianoche de Ciudad de México", async () => {
  const { getMexicoCityMonthStart } = await planLimits()

  assert.equal(
    getMexicoCityMonthStart(new Date("2026-08-01T05:59:59.999Z")).toISOString(),
    "2026-07-01T06:00:00.000Z",
  )
  assert.equal(
    getMexicoCityMonthStart(new Date("2026-08-01T06:00:00.000Z")).toISOString(),
    "2026-08-01T06:00:00.000Z",
  )
})

test("bloquea checkouts al alcanzar el máximo mensual de órdenes", async () => {
  let orderWhere: unknown
  const client = {
    storeSubscription: {
      findUnique: async () => ({ status: "ACTIVE", plan: { maxOrdersMonth: 20 } }),
    },
    plan: {
      findFirst: async () => ({ maxOrdersMonth: 10 }),
    },
    order: {
      count: async ({ where }: { where: unknown }) => {
        orderWhere = where
        return 20
      },
    },
  } as unknown as OrderLimitClient
  const { checkOrderLimit } = await planLimits()

  assert.deepEqual(
    await checkOrderLimit("store_1", client, new Date("2026-07-13T18:00:00.000Z")),
    { ok: false, count: 20, max: 20 },
  )
  assert.deepEqual(orderWhere, {
    storeId: "store_1",
    createdAt: { gte: new Date("2026-07-01T06:00:00.000Z") },
    status: { notIn: ["CANCELLED", "REFUNDED"] },
    deletedAt: null,
  })
})
