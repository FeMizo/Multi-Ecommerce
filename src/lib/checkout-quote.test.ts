import assert from "node:assert/strict"
import test from "node:test"
import { quoteCheckout } from "./checkout-quote"
const product = { id: "p1", storeId: "shop", price: 25.5, manageStock: true, stock: 10, variantOptions: [] }
const store = { id: "shop", deliveryFee: 45, deliveryZone: "Centro", latitude: 20, longitude: -89 }
const item = { productId: "p1", quantity: 2, variantSelection: [] }
const coupon = { code: "AHORRA10", type: "PERCENTAGE" as const, value: 10, minOrderAmount: null, maxRedemptions: null, redeemedCount: 0, startsAt: null, endsAt: null, isActive: true }

test("local delivery rejects blank zones and invalid store coordinates", () => {
  for (const invalid of [{ deliveryZone: "   " }, { latitude: NaN }, { latitude: 91 }, { longitude: Infinity }, { longitude: -181 }]) {
    assert.throws(() => quoteCheckout({ store: { ...store, ...invalid }, products: [product], items: [item], deliveryMethod: "LOCAL_DELIVERY" }), /entrega local/)
  }
})
test("quote uses authoritative price, exact cents and configured shipping", () => {
  const quote = quoteCheckout({ store, products: [product], items: [item], deliveryMethod: "LOCAL_DELIVERY" })
  assert.deepEqual(quote, { subtotal: 51, discountAmount: 0, shippingFee: 45, total: 96, couponCode: null, unitPrices: { p1: 25.5 } })
})
test("coupon preview matches existing checkout rules; pickup is free", () => {
  const quote = quoteCheckout({ store, products: [product], items: [item], deliveryMethod: "PICKUP", couponCode: "AHORRA10", coupon })
  assert.equal(quote.discountAmount, 5)
  assert.equal(quote.total, 46)
  assert.equal(quote.shippingFee, 0)
})
test("reject unavailable, cross-store and insufficient-stock products", () => {
  for (const products of [[], [{ ...product, storeId: "other" }], [{ ...product, stock: 1 }]]) {
    assert.throws(() => quoteCheckout({ store, products, items: [item], deliveryMethod: "PICKUP" }))
  }
})
test("reject duplicate variants, invalid quantity, missing shipping and invalid coupon", () => {
  const base = { store, products: [product], items: [item], deliveryMethod: "LOCAL_DELIVERY" as const }
  assert.throws(() => quoteCheckout({ ...base, items: [item, item] }))
  assert.throws(() => quoteCheckout({ ...base, items: [{ ...item, quantity: -1 }] }))
  assert.throws(() => quoteCheckout({ ...base, store: { ...store, deliveryFee: null } }))
  assert.throws(() => quoteCheckout({ ...base, couponCode: "INVALID" }))
  assert.throws(() => quoteCheckout({ ...base, couponCode: "AHORRA10", coupon: { ...coupon, isActive: false } }))
})

test("shared product stock cannot be exceeded across distinct variants", () => {
  const variants = [{ name: "Color", values: [{ value: "Azul" }, { value: "Verde" }] }]
  assert.throws(() => quoteCheckout({ store, products: [{ ...product, stock: 5, variantOptions: variants }], items: ["Azul", "Verde"].map((value) => ({ productId: product.id, quantity: 4, variantSelection: [{ name: "Color", value }] })), deliveryMethod: "PICKUP" }))
})
