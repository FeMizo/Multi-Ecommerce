import { test } from "node:test"
import assert from "node:assert/strict"
import { normalizeVariantOptions, getVariantImage } from "./product-variants"
test("variant image follows the same case-insensitive identity as checkout", () => {
  const options = normalizeVariantOptions([{ name: "Color", values: [{ value: "Verde", imageUrl: "https://example.com/green.jpg" }] }])
  assert.equal(getVariantImage(options, [{ name: " color ", value: " VERDE " }], ["blue.jpg"]), "https://example.com/green.jpg")
})
test("selected image survives normalization and never uses another variant", () => {
  const options = normalizeVariantOptions([{ name: "Color", values: [{ value: "Azul", imageUrl: "https://example.com/blue.jpg" }, { value: "Verde", imageUrl: "https://example.com/green.jpg" }, { value: "Rojo" }] }])
  assert.equal(getVariantImage(options, [{name: "Color", value: "Verde"}], ["general.jpg"]), "https://example.com/green.jpg")
  assert.equal(getVariantImage(options, [{name: "Color", value: "Rojo"}], ["general.jpg"]), "general.jpg")
})

test("fallback excludes images explicitly assigned to a different variant", () => {
  const options = normalizeVariantOptions([{name:"Color",values:[{value:"Azul",imageUrl:"https://example.com/blue.jpg"},{value:"Rojo"}]}])
  assert.equal(getVariantImage(options,[{name:"Color",value:"Rojo"}],["https://example.com/blue.jpg"]), "")
})
