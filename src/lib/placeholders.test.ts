import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_PRODUCT_IMAGE, withProductPlaceholder } from "./placeholders"

test("conserva la primera imagen real del producto", () => {
  assert.equal(withProductPlaceholder(["https://example.com/product.webp"]), "https://example.com/product.webp")
})

test("usa el placeholder cuando el producto no tiene imágenes", () => {
  assert.equal(withProductPlaceholder([]), DEFAULT_PRODUCT_IMAGE)
})

test("ignora una primera imagen vacía", () => {
  assert.equal(withProductPlaceholder([""]), DEFAULT_PRODUCT_IMAGE)
})
