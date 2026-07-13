import assert from "node:assert/strict"
import test from "node:test"
import { getStoreBlobMigration } from "./blob-migration"

const input = {
  storeId: "store-id",
  storeSlug: "mi-tienda",
  blobHostname: "abc.public.blob.vercel-storage.com",
}

test("convierte rutas antiguas basadas en id al slug de la tienda", () => {
  assert.deepEqual(
    getStoreBlobMigration({
      ...input,
      url: "https://abc.public.blob.vercel-storage.com/uploads/store-id/logo.png",
    }),
    {
      sourceUrl: "https://abc.public.blob.vercel-storage.com/uploads/store-id/logo.png",
      targetPath: "uploads/mi-tienda/logo.png",
      targetUrl: "https://abc.public.blob.vercel-storage.com/uploads/mi-tienda/logo.png",
    },
  )
})

test("ignora otros stores, hosts y rutas anidadas inesperadas", () => {
  assert.equal(
    getStoreBlobMigration({
      ...input,
      url: "https://otro.example/uploads/store-id/logo.png",
    }),
    null,
  )
  assert.equal(
    getStoreBlobMigration({
      ...input,
      url: "https://abc.public.blob.vercel-storage.com/uploads/otro/logo.png",
    }),
    null,
  )
  assert.equal(
    getStoreBlobMigration({
      ...input,
      url: "https://abc.public.blob.vercel-storage.com/uploads/store-id/carpeta/logo.png",
    }),
    null,
  )
})
