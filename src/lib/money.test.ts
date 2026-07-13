import assert from "node:assert/strict"
import test from "node:test"
import { fromMinorUnits, hasAtMostTwoDecimals, toMinorUnits } from "./money"

test("convierte MXN a centavos sin perder precisión", () => {
  assert.equal(toMinorUnits(50), 5_000)
  assert.equal(toMinorUnits(199.99), 19_999)
  assert.equal(fromMinorUnits(40_000), 400)
})

test("rechaza montos MXN con más de dos decimales", () => {
  assert.equal(hasAtMostTwoDecimals(19.99), true)
  assert.equal(hasAtMostTwoDecimals(19.999), false)
  assert.throws(() => toMinorUnits(19.999), /máximo dos decimales/)
})
