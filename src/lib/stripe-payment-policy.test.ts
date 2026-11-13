import assert from "node:assert/strict"
import test from "node:test"
import { stripePaymentAvailability, stripeTestMisconfigured, subscriptionLineItem } from "./stripe-payment-policy"
import { stripePaymentPresentation } from "./payment-methods"
test("LIVE and default preserve seller onboarding; TEST cannot enable live credentials", () => {
  assert.deepEqual(stripePaymentAvailability(true, {}), { stripeOnboarded: true, stripeTestMode: false })
  assert.equal(stripePaymentAvailability(false, { STRIPE_MODE: "live" }).stripeOnboarded, false)
  assert.deepEqual(stripePaymentAvailability(true, { STRIPE_MODE: "test", STRIPE_TEST_SECRET_KEY: "sk_live_fixture" }), { stripeOnboarded: false, stripeTestMode: true })
  assert.deepEqual(stripePaymentAvailability(false, { STRIPE_MODE: "test", STRIPE_TEST_SECRET_KEY: "sk_test_fixture" }), { stripeOnboarded: true, stripeTestMode: true })
})
test("only explicitly misconfigured TEST blocks the existing payment routes", () => {
  assert.equal(stripeTestMisconfigured({}), false)
  assert.equal(stripeTestMisconfigured({ STRIPE_MODE: "live" }), false)
  assert.equal(stripeTestMisconfigured({ STRIPE_MODE: "test" }), true)
  assert.equal(stripeTestMisconfigured({ STRIPE_MODE: "test", STRIPE_TEST_SECRET_KEY: "sk_test_fixture" }), false)
})
test("real subscriptions retain registered Stripe prices; sandbox uses isolated inline prices", () => {
  const plan = { stripePriceId: "price_live_fixture", priceMonthly: 50, name: "Starter" }
  assert.deepEqual(subscriptionLineItem(plan, false), { price: "price_live_fixture", quantity: 1 })
  assert.deepEqual(subscriptionLineItem(plan, true), { price_data: { currency: "mxn", unit_amount: 5000, recurring: { interval: "month" }, product_data: { name: "Starter" } }, quantity: 1 })
  assert.throws(() => subscriptionLineItem({ ...plan, stripePriceId: null }, false))
})
test("real payments are never presented as free test charges", () => {
  assert.doesNotMatch(stripePaymentPresentation(false).label, /TEST/)
  assert.doesNotMatch(stripePaymentPresentation(false).description, /Sin cargos reales/)
  assert.match(stripePaymentPresentation(true).label, /TEST/)
})
