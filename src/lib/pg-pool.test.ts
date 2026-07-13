import assert from "node:assert/strict"
import test from "node:test"
import { getPgSslConfig } from "./pg-pool"

test("permite certificados autofirmados solo cuando se habilita explícitamente", () => {
  assert.deepEqual(getPgSslConfig(true), {
    rejectUnauthorized: false,
  })
})

test("producción valida la cadena TLS con la CA configurada", () => {
  assert.deepEqual(
    getPgSslConfig(
      false,
      "-----BEGIN CERTIFICATE-----\\nCA\\n-----END CERTIFICATE-----",
    ),
    {
      rejectUnauthorized: true,
      ca: "-----BEGIN CERTIFICATE-----\nCA\n-----END CERTIFICATE-----",
    },
  )
})

test("producción usa las autoridades del sistema cuando no recibe una CA", () => {
  assert.deepEqual(getPgSslConfig(false, ""), {
    rejectUnauthorized: true,
  })
})
