import assert from "node:assert/strict"
import test from "node:test"
import {
  accumulateVariantQuantities,
  defaultVariantSelection,
  getVariantQuantityLimit,
  normalizeVariantOptions,
  type ProductVariantSelection,
} from "./product-variants"

const options = normalizeVariantOptions([
  { name: "Talla", values: [{ value: "M", quantity: 2 }, { value: "L", quantity: 5 }] },
  { name: "Color", values: [{ value: "Azul", quantity: 4 }] },
])

test("una selección incompleta o desconocida no permite recurrir al stock general", () => {
  const invalid: ProductVariantSelection[][] = [
    [],
    [{ name: "Color", value: "Azul" }],
    [{ name: "Talla", value: "XL" }, { name: "Color", value: "Azul" }],
    [{ name: "Material", value: "Algodón" }, { name: "Color", value: "Azul" }],
    [{ name: "Color", value: "Azul" }, { name: " color ", value: "Azul" }],
    [...defaultVariantSelection(options), { name: "Extra", value: "Sí" }],
  ]
  for (const selection of invalid) {
    const limit = getVariantQuantityLimit(options, selection)
    assert.equal(limit, 0, JSON.stringify(selection))
    assert.equal((limit ?? 100) >= 1, false)
  }
})

test("selecciones completas respetan el menor límite y normalizan mayúsculas y espacios", () => {
  assert.equal(getVariantQuantityLimit(options, defaultVariantSelection(options)), 2)
  assert.equal(getVariantQuantityLimit(options, [
    { name: " color ", value: " AZUL " },
    { name: " TALLA ", value: " l " },
  ]), 4)
})

test("variantes sin cantidad y productos simples mantienen el límite general", () => {
  const unlimited = normalizeVariantOptions([{ name: "Color", values: ["Azul"] }])
  assert.equal(getVariantQuantityLimit(unlimited, defaultVariantSelection(unlimited)), null)
  assert.equal(getVariantQuantityLimit([], []), null)
  assert.equal(getVariantQuantityLimit(unlimited, []), 0)
})

test("una solicitud rechazada no consume límites para intentos posteriores", () => {
  const requested = new Map<string, number>()
  const medium = defaultVariantSelection(options)
  const large = [{ name: "Talla", value: "L" }, { name: "Color", value: "Azul" }]
  assert.equal(accumulateVariantQuantities("product-a", options, medium, 2, requested), true)
  const previous = [...requested]
  assert.equal(accumulateVariantQuantities("product-a", options, large, 3, requested), false)
  assert.deepEqual([...requested], previous)
  assert.equal(accumulateVariantQuantities("product-a", options, large, 2, requested), true)
  assert.equal(accumulateVariantQuantities("product-b", options, medium, 2, requested), true)
})
