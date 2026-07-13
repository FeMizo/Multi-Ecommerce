import assert from "node:assert/strict"
import test from "node:test"
import { getCurrentPeriodEnd, hasPlanEntitlements, isFullRefund } from "./billing-rules"

test("solo las suscripciones activas o en prueba conservan beneficios", () => {
  assert.equal(hasPlanEntitlements("ACTIVE"), true)
  assert.equal(hasPlanEntitlements("TRIALING"), true)
  assert.equal(hasPlanEntitlements("PAST_DUE"), false)
  assert.equal(hasPlanEntitlements("UNPAID"), false)
  assert.equal(hasPlanEntitlements("CANCELLED"), false)
})

test("usa el final de periodo más lejano de los items de Stripe", () => {
  assert.equal(getCurrentPeriodEnd([]), null)
  assert.equal(getCurrentPeriodEnd([1_700_000_000, 1_800_000_000])?.toISOString(), "2027-01-15T08:00:00.000Z")
})

test("un refund solo es completo cuando coincide con el total cobrado", () => {
  assert.equal(isFullRefund(199.99, 19_999), true)
  assert.equal(isFullRefund(199.99, 10_000), false)
})
