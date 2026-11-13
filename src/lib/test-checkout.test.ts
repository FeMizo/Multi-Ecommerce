import { test } from "node:test"
import assert from "node:assert/strict"
import type Stripe from "stripe"
import { confirmTestCheckout, isPaidTestDraft } from "./test-checkout"

test("declined, unpaid, LIVE, and subscription sessions cannot create TEST orders", async () => {
  const originalMode = process.env.STRIPE_MODE
  const originalKey = process.env.STRIPE_TEST_SECRET_KEY
  process.env.STRIPE_MODE = "test"
  process.env.STRIPE_TEST_SECRET_KEY = "sk_test_fixture"
  try {
    // No database is configured for these tests: touching order persistence would fail.
    for (const session of [
      { livemode: false, mode: "payment", payment_status: "unpaid", metadata: { testDraftId: "declined" } },
      { livemode: true, mode: "payment", payment_status: "paid", metadata: { testDraftId: "live" } },
      { livemode: false, mode: "subscription", payment_status: "paid", metadata: { testDraftId: "subscription" } },
      { livemode: false, mode: "payment", payment_status: "paid", metadata: {} },
    ]) {
      assert.equal(await confirmTestCheckout(session as Stripe.Checkout.Session), null)
    }
    assert.equal(isPaidTestDraft({ livemode: false, mode: "payment", payment_status: "paid", metadata: { testDraftId: "valid" } }), true)
  } finally {
    if (originalMode === undefined) delete process.env.STRIPE_MODE
    else process.env.STRIPE_MODE = originalMode
    if (originalKey === undefined) delete process.env.STRIPE_TEST_SECRET_KEY
    else process.env.STRIPE_TEST_SECRET_KEY = originalKey
  }
})
