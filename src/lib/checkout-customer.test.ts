import assert from "node:assert/strict"
import test from "node:test"
import { checkoutCustomerSchema } from "./checkout-customer"

const customer = { fullName: "Cliente de prueba", email: "cliente@example.com", phone: "+52 (938) 123-4567", city: "Carmen" }

test("checkout rejects whitespace-only identity and non-phone text", () => {
  for (const invalid of [{ fullName: "   " }, { city: "  " }, { phone: "abcdefghi" }, { phone: "         " }]) {
    assert.equal(checkoutCustomerSchema.safeParse({ ...customer, ...invalid }).success, false)
  }
})

test("checkout trims identity fields and accepts formatted phone numbers", () => {
  assert.deepEqual(checkoutCustomerSchema.parse({ ...customer, fullName: " Cliente de prueba ", email: " cliente@example.com ", city: " Carmen " }), customer)
})
