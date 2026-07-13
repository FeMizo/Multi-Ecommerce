import assert from "node:assert/strict"
import test from "node:test"
import { buildStoreUploadPath } from "./blob-path"

test("organiza cada archivo dentro del slug de la tienda", () => {
  assert.equal(
    buildStoreUploadPath("propietario", "banner principal.webp", "upload-1"),
    "uploads/propietario/upload-1-banner-principal.webp",
  )
})

test("evita que tienda y archivo introduzcan segmentos de ruta", () => {
  assert.equal(
    buildStoreUploadPath("../otra", "../imagen.png", "upload-2"),
    "uploads/..-otra/upload-2-..-imagen.png",
  )
})
