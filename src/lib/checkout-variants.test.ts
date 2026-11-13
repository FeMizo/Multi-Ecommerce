import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"
import * as variants from "./product-variants"

// Ejecuta el bucle real de validación sin cargar rutas, credenciales ni servicios.
function loadValidationLoop(path: string) {
  const source = ts.createSourceFile(path, readFileSync(resolve(path), "utf8"), ts.ScriptTarget.Latest, true)
  let loop: ts.ForOfStatement | undefined
  let availability: ts.IfStatement | undefined
  const declarations: string[] = []
  function visit(node: ts.Node) {
    if (ts.isForOfStatement(node) && node.getText(source).includes("product.manageStock")) loop = node
    if (ts.isIfStatement(node) && node.expression.getText(source).startsWith("products.length !==")) availability = node
    if (ts.isVariableStatement(node) && node.declarationList.declarations.some((entry) =>
      ["requestedVariants", "requestedVariantQuantities"].includes(entry.name.getText(source))
    )) declarations.push(node.getText(source))
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(loop, `Bucle de validación no encontrado: ${path}`)
  assert.ok(availability, `Comprobación de productos no encontrada: ${path}`)
  return ts.transpileModule(`(async () => { ${availability.getText(source)} ${declarations.join("\n")} ${loop.getText(source)} })()`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
}

for (const path of ["src/app/api/checkout/route.ts", "src/app/api/webhooks/stripe/route.ts"]) {
  test(`${path}: valida variantes antes de omitir inventario`, async () => {
    const code = loadValidationLoop(path)
    const options = [{ name: "Talla", values: [{ value: "M", quantity: 2 }] }]
    async function run(selection: unknown, manageStock = false, quantity = 1, variantOptions = options) {
      let updates = 0
      await runInNewContext(code, {
        ...variants,
        items: [{ productId: "test-product", quantity, variantSelection: selection }],
        products: [{ id: "test-product", manageStock, stock: 10, variantOptions }],
        storeId: "test-store", metadata: { storeId: "test-store" },
        tx: { product: { updateMany: async (input: { where: { storeId: string } }) => {
          assert.equal(input.where.storeId, "test-store")
          updates++
          return { count: 1 }
        } } },
      }, { timeout: 1_000 })
      return updates
    }

    for (const selection of [null, "M", [null], [{ name: 1, value: "M" }], [], [{ name: "Talla", value: "XL" }], [{ name: "Otro", value: "M" }]]) {
      await assert.rejects(run(selection), /VARIANT_UNAVAILABLE|Variante/)
    }
    assert.equal(await run([{ name: "Talla", value: "M" }]), 0)
    assert.equal(await run([{ name: "Talla", value: "M" }], true), 1)
    await assert.rejects(run([{ name: "Talla", value: "M" }], true, 3), /STOCK_UNAVAILABLE|Stock/)
    assert.equal(await run([], false, 1, []), 0)
    await assert.rejects(run([{ name: "Talla", value: "M" }], false, 1, []), /VARIANT_UNAVAILABLE|Variante/)
  })

  test(`${path}: permite dos variantes del mismo producto sin admitir duplicados ni productos ausentes`, async () => {
    const code = loadValidationLoop(path)
    const products = [{ id: "test-product", manageStock: false, stock: 10,
      variantOptions: [{ name: "Talla", values: ["M", "L"] }] }]
    const makeItem = (value: string) => ({ productId: "test-product", quantity: 1, variantSelection: [{ name: "Talla", value }] })
    const run = (items: unknown[]) => runInNewContext(code, { ...variants, products, items }, { timeout: 1_000 })
    await run([makeItem("M"), makeItem("L")])
    await assert.rejects(run([makeItem("M"), makeItem(" m ")]), /VARIANT_UNAVAILABLE|Variante/)
    await assert.rejects(run([makeItem("M"), { ...makeItem("L"), productId: "missing-product" }]), /PRODUCTS_UNAVAILABLE|Productos/)
  })

  test(`${path}: acumula límites de opciones compartidas sin mezclar productos`, async () => {
    const code = loadValidationLoop(path)
    const product = { id: "product-a", stock: 20, manageStock: true, variantOptions: [
      { name: "Talla", values: [{ value: "M", quantity: 4 }, { value: "L", quantity: 4 }] },
      { name: "Color", values: [{ value: "Azul", quantity: 3 }] },
    ] }
    const makeItem = (size: string, quantity: number, productId = "product-a") => ({ productId, quantity,
      variantSelection: [{ name: "Talla", value: size }, { name: " color ", value: " AZUL " }] })
    const run = (items: unknown[], products = [product]) => runInNewContext(code, {
      ...variants, items, products, storeId: "test-store", metadata: { storeId: "test-store" },
      tx: { product: { updateMany: async () => ({ count: 1 }) } },
    }, { timeout: 1_000 })
    await assert.rejects(run([makeItem("M", 2), makeItem("L", 2)]), /STOCK_UNAVAILABLE|Stock/)
    await run([makeItem("M", 2), makeItem("L", 1)])
    await run([makeItem("M", 2), makeItem("L", 2, "product-b")], [product, { ...product, id: "product-b" }])
    await run([makeItem("M", 2), makeItem("L", 2)], [{ ...product, manageStock: false }])
  })
}
