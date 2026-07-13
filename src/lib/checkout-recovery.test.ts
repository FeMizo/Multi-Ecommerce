import assert from "node:assert/strict"
import test from "node:test"
import { checkoutRecoveryAction } from "./checkout-recovery"

test("una sesión completada nunca libera inventario reservado", () => {
  assert.equal(checkoutRecoveryAction("complete"), "preserve")
  assert.equal(checkoutRecoveryAction(null), "preserve")
})

test("una sesión abierta se cierra antes de liberar y una expirada se libera", () => {
  assert.equal(checkoutRecoveryAction("open"), "expire_then_release")
  assert.equal(checkoutRecoveryAction("expired"), "release")
})
