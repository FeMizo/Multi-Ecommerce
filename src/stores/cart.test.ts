import assert from "node:assert/strict"
import test from "node:test"
import { useCartStore } from "./cart"

const item = {
  id: "product-a:default", productId: "product-a", storeId: "store-a",
  name: "Producto de prueba", price: 100, image: "", storeName: "Tienda A",
  variantKey: "default", variantSelection: [],
}

test("rechaza cantidades negativas, fraccionarias y no finitas sin alterar el carrito", () => {
  useCartStore.getState().clearCart()
  useCartStore.getState().addItem(item)
  for (const quantity of [-1, 1.5, NaN, Infinity, -Infinity]) {
    useCartStore.getState().updateQuantity(item.id, quantity)
    assert.equal(useCartStore.getState().items[0].quantity, 1)
    assert.equal(useCartStore.getState().total(), 100)
  }
})

test("actualiza y elimina solo el artículo seleccionado entre tiendas", () => {
  useCartStore.getState().clearCart()
  useCartStore.getState().addItem(item)
  useCartStore.getState().addItem({ ...item, id: "product-b:default", productId: "product-b", storeId: "store-b" })
  useCartStore.getState().updateQuantity(item.id, 3)
  assert.equal(useCartStore.getState().total(), 400)
  useCartStore.getState().updateQuantity(item.id, 0)
  assert.deepEqual(useCartStore.getState().items.map((entry) => entry.storeId), ["store-b"])
  assert.equal(useCartStore.getState().total(), 100)
})
