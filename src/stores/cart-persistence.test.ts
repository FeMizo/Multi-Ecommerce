import assert from "node:assert/strict"
import test from "node:test"

const item = {
  id: "product-a:default", productId: "product-a", storeId: "store-a",
  name: "Producto de prueba", price: 100, image: "", storeName: "Tienda A",
  variantKey: "default", variantSelection: [], quantity: 2,
}

test("restaura el carrito con almacenamiento sintético local", async (t) => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window")
  const data = new Map<string, string>()
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    } },
  })

  try {
    const { useCartStore } = await import("./cart")
    async function restore(state: unknown, version = 2) {
      data.set("cart-store", JSON.stringify({ state, version }))
      await useCartStore.persist.rehydrate()
    }

    await t.test("descarta cantidades inválidas sin perder productos de otra tienda", async () => {
      const invalid = [-1, 0, 1.5, null, "2", Number.MAX_SAFE_INTEGER + 1]
      await restore({ items: [
        ...invalid.map((quantity, index) => ({ ...item, id: `invalid-${index}`, quantity })),
        { ...item, id: "product-b:default", storeId: "store-b" },
      ] })
      assert.deepEqual(useCartStore.getState().items.map((entry) => entry.storeId), ["store-b"])
      assert.equal(useCartStore.getState().total(), 200)
    })

    await t.test("no restaura acciones ni apertura desde datos persistidos", async () => {
      await restore({ items: [item], total: 0, clearCart: null, isOpen: true })
      assert.equal(typeof useCartStore.getState().total, "function")
      assert.equal(typeof useCartStore.getState().clearCart, "function")
      assert.equal(useCartStore.getState().isOpen, false)
      assert.equal(useCartStore.getState().total(), 200)
    })

    await t.test("descarta artículos con precios o metadatos dañados conservando los válidos", async () => {
      const invalid = [
        { price: "100" }, { price: -1 }, { price: null }, { price: Number.MAX_VALUE },
        { id: "" }, { productId: " " }, { storeId: null }, { name: {} }, { image: [] },
        { storeName: false }, { variantKey: null }, { variantSelection: "M" },
        { variantSelection: [null] }, { variantSelection: [{ name: "Talla", value: 1 }] },
      ]
      await restore({ items: [
        ...invalid.map((fields) => ({ ...item, ...fields })),
        { ...item, id: "product-b:default", storeId: "store-b", variantSelection: [{ name: "Talla", value: "M" }] },
      ] })
      assert.deepEqual(useCartStore.getState().items.map((entry) => entry.storeId), ["store-b"])
      assert.equal(useCartStore.getState().total(), 200)
      await useCartStore.persist.rehydrate()
      assert.equal(useCartStore.getState().total(), 200)
      useCartStore.getState().removeStoreItems("store-a")
      assert.equal(useCartStore.getState().items.length, 1)
    })

    await t.test("tolera colección inválida y conserva la migración de cantidades omitidas", async () => {
      await restore({ items: null })
      assert.deepEqual(useCartStore.getState().items, [])
      await restore({ items: [null, { ...item, quantity: -2 }, { ...item, quantity: undefined }] }, 1)
      assert.equal(useCartStore.getState().items.length, 1)
      assert.equal(useCartStore.getState().items[0].quantity, 1)
      assert.equal(useCartStore.getState().total(), 100)
    })

    await t.test("migraciones antiguas no inventan precio ni identificadores ausentes", async () => {
      for (const version of [0, 1]) {
        await restore({ items: [
          { ...item, price: undefined },
          { ...item, price: null },
          { ...item, id: undefined, productId: undefined },
          { ...item, id: "legacy-id", productId: undefined, quantity: undefined },
          { ...item, id: undefined, productId: "legacy-product", price: 0 },
        ] }, version)
        assert.deepEqual(useCartStore.getState().items.map((entry) => entry.id), ["legacy-id", "legacy-product"])
        assert.equal(useCartStore.getState().items[0].productId, "legacy-id")
        assert.equal(useCartStore.getState().items[0].quantity, 1)
        assert.equal(useCartStore.getState().items[1].price, 0)
        assert.equal(useCartStore.getState().total(), 100)
        await useCartStore.persist.rehydrate()
        assert.equal(useCartStore.getState().items.length, 2)
        assert.equal(useCartStore.getState().total(), 100)
      }
    })

    await t.test("una segunda recarga conserva cantidades válidas y permite eliminar por tienda", async () => {
      await restore({ items: [item, { ...item, id: "product-b:default", storeId: "store-b" }] })
      useCartStore.getState().updateQuantity(item.id, 3)
      await useCartStore.persist.rehydrate()
      assert.equal(useCartStore.getState().total(), 500)
      useCartStore.getState().removeStoreItems("store-a")
      await useCartStore.persist.rehydrate()
      assert.deepEqual(useCartStore.getState().items.map((entry) => entry.storeId), ["store-b"])
    })

    await t.test("almacenamiento ausente o JSON roto no destruye el carrito en memoria", async () => {
      await restore({ items: [item] })
      data.delete("cart-store")
      await useCartStore.persist.rehydrate()
      assert.equal(useCartStore.getState().total(), 200)
      data.set("cart-store", "{invalid")
      await useCartStore.persist.rehydrate()
      assert.equal(useCartStore.getState().total(), 200)
      assert.equal(typeof useCartStore.getState().updateQuantity, "function")
    })
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow)
    else Reflect.deleteProperty(globalThis, "window")
  }
})
