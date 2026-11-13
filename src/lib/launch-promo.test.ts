import { test } from "node:test"
import assert from "node:assert/strict"
import { isLaunchOpen, launchBaseSlug, launchPrice } from "./launch-promo"
import { PLAN_CATALOG } from "./plan-catalog"
import { getStripeTestDatabaseUrl, isStripeTestMode } from "./stripe-test-mode"

test("launch dates use Mexico City boundaries, not UTC midnight", () => {
  assert.equal(isLaunchOpen(new Date("2026-11-13T05:59:59Z")), false)
  assert.equal(isLaunchOpen(new Date("2026-11-13T06:00:00Z")), true)
  assert.equal(isLaunchOpen(new Date("2026-12-01T05:59:59Z")), true)
  assert.equal(isLaunchOpen(new Date("2026-12-01T06:00:00Z")), false)
})
test("eight catalog offers preserve all original entitlements", () => {
  const promos = PLAN_CATALOG.map(base => ({ ...base, slug: `${base.slug}-promo`, priceMonthly: launchPrice(base.priceMonthly) }))
  assert.equal(PLAN_CATALOG.length + promos.length, 8)
  assert.deepEqual(PLAN_CATALOG.map(p => p.priceMonthly), [50, 100, 400, 1000])
  assert.deepEqual(promos.map(p => p.priceMonthly), [40, 80, 320, 800])
  promos.forEach((promo, i) => {
    const base = PLAN_CATALOG[i]
    assert.equal(promo.priceMonthly, launchPrice(base.priceMonthly))
    assert.equal(launchBaseSlug(promo.slug), base.slug)
    assert.deepEqual([promo.maxProducts, promo.maxOrdersMonth, promo.commissionRate, promo.features], [base.maxProducts, base.maxOrdersMonth, base.commissionRate, base.features])
  })
  assert.equal(launchBaseSlug("unknown-promo"), null)
})
test("TEST requires explicit mode and a separate test key; live fallback is rejected", () => {
  assert.equal(isStripeTestMode({ STRIPE_MODE: "test", STRIPE_TEST_SECRET_KEY: "sk_test_fixture" }), true)
  assert.equal(isStripeTestMode({ STRIPE_MODE: "test", STRIPE_TEST_SECRET_KEY: "sk_live_fixture" }), false)
  assert.equal(isStripeTestMode({ STRIPE_MODE: "test", STRIPE_SECRET_KEY: "sk_live_fixture" }), false)
  assert.equal(isStripeTestMode({ STRIPE_TEST_SECRET_KEY: "sk_test_fixture" }), false)
})

test("TEST cannot use the existing database even with different credentials or query parameters", () => {
  assert.throws(() => getStripeTestDatabaseUrl({}), /base aislada/)
  assert.throws(() => getStripeTestDatabaseUrl({ STRIPE_TEST_DATABASE_URL: "postgres://test:secret@localhost/shop?sslmode=require", DATABASE_URL: "postgres://live:secret@localhost:5432/shop" }), /distinta/)
  assert.equal(getStripeTestDatabaseUrl({ STRIPE_TEST_DATABASE_URL: "postgres://localhost/shop_test", DATABASE_URL: "postgres://localhost/shop" }), "postgres://localhost/shop_test")
})
